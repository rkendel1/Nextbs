async function testApiFetch() {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/saas/whitelabel/creator-by-domain?domain=randy-kendel');
    
    if (!response.ok) {
      console.log('API response not ok:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response for domain=randy-kendel:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testApiFetch();