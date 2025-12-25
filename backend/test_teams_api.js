import fetch from 'node-fetch';

const testTeamsEndpoint = async () => {
    try {
        // First, login to get a token
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'test1', password: 'Temp@123' })
        });

        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);

        const token = loginData.token;

        // Now test the teams endpoint
        const teamsResponse = await fetch('http://localhost:5000/api/events/4/teams', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const teamsData = await teamsResponse.json();
        console.log('\nTeams endpoint response status:', teamsResponse.status);
        console.log('Teams data:', JSON.stringify(teamsData, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
};

testTeamsEndpoint();
