import fetch from 'node-fetch';

const testWithJuryAuth = async () => {
    try {
        // Login as jury
        console.log('Logging in as jury: test1@gmail.com...');
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'test1@gmail.com',
                password: 'Temp@123'
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login status:', loginResponse.status);
        console.log('Login response:', loginData);

        if (!loginData.token) {
            console.error('No token received!');
            return;
        }

        const token = loginData.token;
        console.log('\n✅ Got token:', token.substring(0, 20) + '...');

        // Test teams endpoint for event 4
        console.log('\nFetching teams for event 4...');
        const teamsResponse = await fetch('http://localhost:5000/api/events/4/teams', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Teams response status:', teamsResponse.status);
        const teamsData = await teamsResponse.json();
        console.log('Teams data:', JSON.stringify(teamsData, null, 2));

        if (teamsData.teams && teamsData.teams.length > 0) {
            console.log(`\n✅ Found ${teamsData.teams.length} teams!`);
        } else {
            console.log('\n❌ No teams found in response');
        }

    } catch (error) {
        console.error('Error:', error);
    }
};

testWithJuryAuth();
