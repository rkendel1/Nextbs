Play Next.js is a free and **Open-source SaaS enablement platform, designed and built to help SaaS creators launch their products quickly**. With its premium design and comprehensive features including onboarding, Stripe OAuth integration, product management, and subscriber portals, it provides everything you need to kickstart a feature-rich SaaS-for-SaaS platform.

This platform enables SaaS creators to:
- **Launch faster**: Complete onboarding and Stripe integration in minutes
- **Manage products**: Centralized dashboard for products, pricing tiers, and subscriptions
- **Track usage**: Built-in metering and analytics for subscriber usage
- **White-label sites**: Customizable subscriber portals for end-users

[![Play Next.js](https://github.com/NextJSTemplates/play-nextjs/blob/main/nextjs-play.png)](https://play.nextjstemplates.com)

## SaaS for SaaS Platform - Enterprise-Grade Features 🚀

Play Next.js SaaS Boilerplate and Starter Kit is a free, open-source solution ideal for startups, SaaS companies, and more. It offers essential UI components, authentication and database integration, and Stripe integration. Its superior design and functionality make it a go-to choice for launching a feature-rich SaaS website efficiently.

### [🚀 View Live Demo](https://play.nextjstemplates.com/)

### [🔌 Documentation](https://nextjstemplates.com/docs)

### All Essential Integrations - DB, Auth, Payment, MDX, and more ⚡

Play Next.js SaaS Platform includes all the key integrations required to build a fully functional SaaS-for-SaaS enablement platform.

- **PostgreSQL for Database**: Comprehensive data models for SaaS creators, products, tiers, subscriptions, usage tracking, and white-label configurations using Prisma ORM.

- **NextAuth for Authentication**: Secure authentication with support for credentials, OAuth providers (Google, GitHub), and magic links.

- **Stripe Connect OAuth**: Deep integration with Stripe for payment processing, allowing SaaS creators to link their Stripe accounts and manage subscriptions seamlessly.

- **Product Management System**: Complete CRUD operations for products and pricing tiers with real-time statistics.

- **Usage Metering & Analytics**: Built-in usage tracking and metering capabilities for consumption-based pricing models.

- **White-Label Subscriber Portals**: Customizable portals for end-users to manage their accounts and subscriptions (coming soon).

These integrations work together to provide a turnkey solution for SaaS creators to launch and manage their products.

### Essential SaaS Pages & Components and Styled Using Tailwind CSS 🎨

This Next.js SaaS Boilerplate and Starter Kit is **styled using Tailwind CSS**, a highly flexible and customizable utility-first CSS framework. Leveraging the power of Tailwind, each component and page of this kit, including **login, signup, blog, about, and others, has been handcrafted to offer top-notch aesthetics** while maintaining peak usability.

### Crafted Using [🎨 TailGrids Components](https://tailgrids.com)

Play Next.js SaaS boilerplate, you can enjoy a professional-looking website that offers seamless operation, all while significantly reducing your web development time and effort.

---

### 🚀 Deploy Now

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNextJSTemplates%2Fplay-nextjs)

[![Deploy with Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/NextJSTemplates/play-nextjs)

### Setup Instructions

Follow these steps to set up and run this template on your local machine:

1. Begin by downloading and extracting the template from **Next.js Templates**.

2. Once you've done that, navigate into the template directory using the **cd** command.

3. Install the necessary dependencies by running the following commands:

```bash
    npm install --legacy-peer-deps
```

**Note:** As of right now React 19 causes peer dependencies issues with some packages, so the `legacy-peer-deps` flag is required.

4. Now you're ready to start the project on your local server. Use the following command to get it up and running:

```bash
    npm run dev
```

This will launch the template on [localhost:3000](http://localhost:3000).

Our comprehensive documentation includes all the guides you'll need for integrating various features.

### Deployment on PaaS

If your project is hosted on a GitHub repository, you can deploy it using free and user-friendly platforms like [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/). Both provide generous free tiers for hosting Next.js projects.

### License Information

Play is Free is completely free and open-source. Feel free to use it for both personal and commercial projects.

### Show Your Support

If you appreciate this project, please consider starring this repository. Your support encourages our team to continue creating more content like this and helps us to reach more users like you!

## Explore More Templates

For a wider range of options, feel free to browse our collection of [Next.js Templates, Boilerplates and Starter Kits](https://nextjstemplates.com/templates).

### Update Log

**06 August 2025** - v2.2.1

- fix: [#21](https://github.com/NextJSTemplates/play-nextjs/issues/21) - Moved context providers to `/src/app/providers.tsx`
- Removed initial loader

**10 April 2025**

- Fix peer deps issue
- Update Next.js for security patch

**29 Jan 2025**

- Upgraded to Next.js 15
- Using `Link` instead of `a` tag
- Fixed all minor bugs

**21 March 2024**

- Upgraded to Next.js 14
- Updated stripe integration
- Fixed auth issues
- Updated all the packages
- Update ts config & fix all the issues
- Update signin & signup page Design
- Integrated Magic link signin
- & Forgot password
