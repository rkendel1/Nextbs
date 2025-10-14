// src/lib/store.js
const { Pool } = require('pg');
const config = require('../config.js');

const pool = new Pool({
  connectionString: config.database.connectionString
});

// Handle unexpected pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Consider reconnect logic in production instead of exit
  process.exit(-1);
});

class Store {
  // ----------------------
  // Site operations
  // ----------------------
  async createSite(data) {
    const { url, domain, title, description, rawHtml, screenshot } = data;
    const query = `
      INSERT INTO sites (url, domain, title, description, raw_html, screenshot)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [url, domain, title, description, rawHtml, screenshot];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getSiteByUrl(url) {
    const result = await pool.query('SELECT * FROM sites WHERE url = $1', [url]);
    return result.rows[0];
  }

  async updateSite(id, data) {
    const { title, description, rawHtml, screenshot } = data;
    const query = `
      UPDATE sites
      SET title = COALESCE($2, title),
          description = COALESCE($3, description),
          raw_html = COALESCE($4, raw_html),
          screenshot = COALESCE($5, screenshot),
          crawled_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const values = [id, title, description, rawHtml, screenshot];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ----------------------
  // Company info operations
  // ----------------------
  async createCompanyInfo(data) {
    const { siteId, companyName, legalName, contactEmails, contactPhones, addresses, structuredJson } = data;
    const query = `
      INSERT INTO company_info
        (site_id, company_name, legal_name, contact_emails, contact_phones, addresses, structured_json)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      siteId,
      companyName,
      legalName,
      JSON.stringify(contactEmails || []),
      JSON.stringify(contactPhones || []),
      JSON.stringify(addresses || []),
      JSON.stringify(structuredJson || {})
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getCompanyInfoBySiteId(siteId) {
    const result = await pool.query('SELECT * FROM company_info WHERE site_id = $1', [siteId]);
    return result.rows[0];
  }

  // ----------------------
  // Design tokens
  // ----------------------
  async createDesignToken(data) {
    const { siteId, tokenKey, tokenType, tokenValue, source, meta } = data;
    const query = `
      INSERT INTO design_tokens
        (site_id, token_key, token_type, token_value, source, meta)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      siteId,
      tokenKey,
      tokenType,
      JSON.stringify(tokenValue),
      source,
      JSON.stringify(meta || {})
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async createDesignTokensBulk(tokens) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const token of tokens) {
        const query = `
          INSERT INTO design_tokens
            (site_id, token_key, token_type, token_value, source, meta)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const values = [
          token.siteId,
          token.tokenKey,
          token.tokenType,
          JSON.stringify(token.tokenValue),
          token.source,
          JSON.stringify(token.meta || {})
        ];
        const result = await client.query(query, values);
        results.push(result.rows[0]);
      }
      await client.query('COMMIT');
      return results;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getDesignTokensBySiteId(siteId) {
    const result = await pool.query(
      'SELECT * FROM design_tokens WHERE site_id = $1 ORDER BY token_type, token_key',
      [siteId]
    );
    return result.rows;
  }

  // ----------------------
  // Products
  // ----------------------
  async createProduct(data) {
    const { siteId, name, slug, price, description, productUrl, metadata } = data;
    const query = `
      INSERT INTO products
        (site_id, name, slug, price, description, product_url, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      siteId,
      name,
      slug,
      price,
      description,
      productUrl,
      JSON.stringify(metadata || {})
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async createProductsBulk(products) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const product of products) {
        const query = `
          INSERT INTO products
            (site_id, name, slug, price, description, product_url, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        const values = [
          product.siteId,
          product.name,
          product.slug,
          product.price,
          product.description,
          product.productUrl,
          JSON.stringify(product.metadata || {})
        ];
        const result = await client.query(query, values);
        results.push(result.rows[0]);
      }
      await client.query('COMMIT');
      return results;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getProductsBySiteId(siteId) {
    const result = await pool.query('SELECT * FROM products WHERE site_id = $1', [siteId]);
    return result.rows;
  }

  // ----------------------
  // Brand voice
  // ----------------------
  async createBrandVoice(data) {
    const { siteId, summary, guidelines, embedding } = data;
    const query = `
      INSERT INTO brand_voice
        (site_id, summary, guidelines, embedding)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [
      siteId,
      summary,
      JSON.stringify(guidelines || {}),
      JSON.stringify(embedding || {})
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getBrandVoiceBySiteId(siteId) {
    const result = await pool.query('SELECT * FROM brand_voice WHERE site_id = $1', [siteId]);
    return result.rows[0];
  }

  // ----------------------
  // Utility: Aggregate site data
  // ----------------------
  async getCompleteSiteData(siteId) {
    const site = await pool.query('SELECT * FROM sites WHERE id = $1', [siteId]);
    const companyInfo = await this.getCompanyInfoBySiteId(siteId);
    const designTokens = await this.getDesignTokensBySiteId(siteId);
    const products = await this.getProductsBySiteId(siteId);
    const brandVoice = await this.getBrandVoiceBySiteId(siteId);

    return {
      site: site.rows[0],
      companyInfo,
      designTokens,
      products,
      brandVoice
    };
  }

  async close() {
    await pool.end();
  }
}

module.exports = new Store();