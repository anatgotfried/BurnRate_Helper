# Strava OAuth Integration Guide

## Overview

This guide explains how to set up Strava OAuth authentication for your Training Peaks workout tracker application. The process involves creating a Strava application, completing OAuth flow, and obtaining access tokens with proper permissions.

## Why OAuth is Required

Strava has different permission levels for API access:
- **Basic `read`**: Can access profile info only
- **`activity:read`**: Can access activities (required for workout data)
- **`profile:read_all`**: Can access detailed profile info

Your customers need OAuth flow to get tokens with `activity:read` permissions.

## Step-by-Step Process

### Step 1: Create Strava Application

1. **Go to**: https://www.strava.com/settings/api
2. **Click "Create or Manage Your App"** (or look for "Create App" button)
3. **Fill in application details**:
   - **Application Name**: "Training Peaks Tracker" (or your app name)
   - **Authorization Callback Domain**: `127.0.0.1:5001` (or your app's domain)
   - **Website**: `http://127.0.0.1:5001` (or your app's URL)
4. **Click "Create"**
5. **Note down**:
   - **Client ID** (e.g., `180503`)
   - **Client Secret** (e.g., `d56f23c5f5ff634fc90ba08df45d5e3266664d11`)

### Step 2: Generate Authorization URL

Use this URL format with your Client ID:

```
https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&approval_prompt=force&scope=activity:read
```

**Parameters**:
- `client_id`: Your application's Client ID
- `response_type`: Must be `code`
- `redirect_uri`: Where user will be redirected after authorization (must match your app's callback domain)
- `approval_prompt`: Use `force` to always show authorization prompt
- `scope`: `activity:read` (required for accessing workout data)

**Example URL**:
```
https://www.strava.com/oauth/authorize?client_id=180503&response_type=code&redirect_uri=http://127.0.0.1:5001&approval_prompt=force&scope=activity:read
```

### Step 3: Complete OAuth Flow

1. **Send authorization URL** to your customer
2. **Customer visits URL** in their browser
3. **Customer authorizes** your application on Strava
4. **Customer gets redirected** to your callback URL with authorization code
5. **Extract authorization code** from the redirect URL

**Redirect URL format**:
```
http://127.0.0.1:5001/?code=AUTHORIZATION_CODE
```

**Authorization code example**:
```
c9dc714a0d8fbfa0e358ad094d0e60dd6d6d8e9a
```

### Step 4: Exchange Authorization Code for Access Token

Make a POST request to Strava's token endpoint:

**Endpoint**: `https://www.strava.com/oauth/token`

**Request Parameters**:
```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET", 
  "code": "AUTHORIZATION_CODE",
  "grant_type": "authorization_code"
}
```

**Example cURL**:
```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=180503 \
  -d client_secret=d56f23c5f5ff634fc90ba08df45d5e3266664d11 \
  -d code=c9dc714a0d8fbfa0e358ad094d0e60dd6d6d8e9a \
  -d grant_type=authorization_code
```

**Success Response**:
```json
{
  "token_type": "Bearer",
  "expires_at": 1568775134,
  "expires_in": 21600,
  "refresh_token": "75506241bf90d075dcbb7001b0f1fa7e8514c7bd",
  "access_token": "66c7037c161fd38a8686061a50d5150e1f49ed19",
  "athlete": {
    "id": 12345,
    "firstname": "John",
    "lastname": "Doe"
  }
}
```

### Step 5: Test Access Token

Test the new access token to ensure it has proper permissions:

**Test Request**:
```bash
curl -H "Authorization: Bearer 66c7037c161fd38a8686061a50d5150e1f49ed19" \
  "https://www.strava.com/api/v3/activities?per_page=1"
```

**Success Response** (Status 200):
```json
[
  {
    "id": 1234567890,
    "name": "Morning Run",
    "distance": 5000,
    "moving_time": 1800,
    "average_heartrate": 150
  }
]
```

## Token Management

### Access Token Properties

- **Expires**: 6 hours after creation (21600 seconds)
- **Permissions**: `activity:read` (can fetch activities)
- **Usage**: Include in `Authorization: Bearer TOKEN` header

### Refresh Token

- **Purpose**: Get new access tokens when current one expires
- **Storage**: Save securely for your customer
- **Usage**: Exchange for new access token when needed

### Token Refresh Process

When access token expires, use refresh token:

**Endpoint**: `https://www.strava.com/oauth/token`

**Request Parameters**:
```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "grant_type": "refresh_token",
  "refresh_token": "CUSTOMER_REFRESH_TOKEN"
}
```

## Implementation for Your App

### Backend Integration

Your app should handle:

1. **OAuth initiation**: Generate authorization URLs for customers
2. **Callback handling**: Receive authorization codes
3. **Token exchange**: Convert codes to access tokens
4. **Token storage**: Securely store customer tokens
5. **Token refresh**: Automatically refresh expired tokens

### Customer Onboarding Flow

1. **Customer requests Strava integration**
2. **You create Strava application** (one-time setup)
3. **You generate authorization URL** for customer
4. **Customer completes OAuth** (one-time setup)
5. **You exchange code for token** (one-time setup)
6. **Customer uses app** with working Strava integration

## Security Considerations

### Client Secret Protection

- **Never expose** Client Secret in frontend code
- **Store securely** on your backend
- **Use environment variables** for configuration

### Token Storage

- **Encrypt** customer access tokens
- **Store refresh tokens** for automatic renewal
- **Implement token rotation** for security

### Rate Limits

Strava API limits:
- **Overall**: 200 requests per 15 minutes, 2,000 daily
- **Read**: 100 requests per 15 minutes, 1,000 daily

**Important**: Always use date range filtering to avoid hitting these limits. The app automatically defaults to the last 30 days to prevent rate limit issues.

## Error Handling

### Common Errors

**401 Unauthorized**:
```json
{
  "message": "Authorization Error",
  "errors": [{
    "resource": "AccessToken",
    "field": "activity:read_permission", 
    "code": "missing"
  }]
}
```
**Solution**: Token missing `activity:read` permission - customer needs OAuth flow

**429 Rate Limit**:
```json
{
  "message": "Rate Limit Exceeded"
}
```
**Solution**: Wait 15 minutes before retrying

**Invalid Authorization Code**:
```json
{
  "message": "Authorization Error",
  "errors": [{
    "resource": "Application",
    "field": "",
    "code": "invalid"
  }]
}
```
**Solution**: Authorization code expired or already used

## Customer Support

### When Customers Ask for Help

1. **"My Strava token doesn't work"**
   - Check if token has `activity:read` permission
   - Guide them through OAuth flow if needed

2. **"I can't find the authorization URL"**
   - Generate it for them using their Client ID
   - Walk them through the OAuth process

3. **"My token expired"**
   - Use their refresh token to get new access token
   - Implement automatic token refresh in your app

### Troubleshooting Steps

1. **Test token permissions**:
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     "https://www.strava.com/api/v3/athlete"
   ```

2. **Check token expiration**:
   - Access tokens expire in 6 hours
   - Use refresh token to get new access token

3. **Verify application settings**:
   - Callback domain matches your app
   - Application is properly configured

## Best Practices

### For Your Application

1. **Implement automatic token refresh**
2. **Cache access tokens** to reduce API calls
3. **Handle rate limits gracefully**
4. **Provide clear error messages** to customers

### For Customer Onboarding

1. **Provide step-by-step instructions**
2. **Generate authorization URLs** for customers
3. **Test tokens** before marking integration complete
4. **Store refresh tokens** for automatic renewal

## Example Implementation

### Python OAuth Helper

```python
import requests
from datetime import datetime, timedelta

class StravaOAuth:
    def __init__(self, client_id, client_secret, redirect_uri):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
    
    def get_authorization_url(self):
        """Generate authorization URL for customer"""
        return (
            f"https://www.strava.com/oauth/authorize"
            f"?client_id={self.client_id}"
            f"&response_type=code"
            f"&redirect_uri={self.redirect_uri}"
            f"&approval_prompt=force"
            f"&scope=activity:read"
        )
    
    def exchange_code_for_token(self, authorization_code):
        """Exchange authorization code for access token"""
        response = requests.post('https://www.strava.com/oauth/token', data={
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': authorization_code,
            'grant_type': 'authorization_code'
        })
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Token exchange failed: {response.text}")
    
    def refresh_access_token(self, refresh_token):
        """Refresh expired access token"""
        response = requests.post('https://www.strava.com/oauth/token', data={
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token
        })
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Token refresh failed: {response.text}")
    
    def test_token(self, access_token):
        """Test if access token has proper permissions"""
        response = requests.get(
            'https://www.strava.com/api/v3/activities',
            headers={'Authorization': f'Bearer {access_token}'},
            params={'per_page': 1}
        )
        return response.status_code == 200
```

### Usage Example

```python
# Initialize OAuth helper
strava_oauth = StravaOAuth(
    client_id='180503',
    client_secret='d56f23c5f5ff634fc90ba08df45d5e3266664d11',
    redirect_uri='http://127.0.0.1:5001'
)

# Generate authorization URL for customer
auth_url = strava_oauth.get_authorization_url()
print(f"Customer should visit: {auth_url}")

# After customer completes OAuth, exchange code for token
authorization_code = "c9dc714a0d8fbfa0e358ad094d0e60dd6d6d8e9a"
token_data = strava_oauth.exchange_code_for_token(authorization_code)

# Test the token
if strava_oauth.test_token(token_data['access_token']):
    print("✅ Token works! Customer can now use Strava integration")
else:
    print("❌ Token failed - customer needs to complete OAuth again")
```

## Summary

The Strava OAuth process involves:

1. **Creating Strava application** (one-time setup)
2. **Generating authorization URLs** for customers
3. **Completing OAuth flow** (customer does this once)
4. **Exchanging codes for tokens** (one-time setup)
5. **Using access tokens** in your app (ongoing)
6. **Refreshing expired tokens** (automatic)

This process ensures your customers get proper `activity:read` permissions and can successfully integrate their Strava data with your Training Peaks workout tracker.
