const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@jobstream.com',
        password: 'Admin123!'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Login failed!');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
};

testLogin();
