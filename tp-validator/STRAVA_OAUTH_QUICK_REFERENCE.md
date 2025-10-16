# Strava OAuth Quick Reference

## For Customer Support

### Customer Says: "My Strava token doesn't work"

**Problem**: Token missing `activity:read` permission
**Solution**: Customer needs OAuth flow

### Customer Says: "I can't get Strava working"

**Check**: Does token have `activity:read` permission?
**Test**: `curl -H "Authorization: Bearer TOKEN" "https://www.strava.com/api/v3/athlete"`
- ✅ Status 200 = Token works
- ❌ Status 401 = Token needs OAuth

### Customer Says: "I don't see Strava workouts"

**Check**: 
1. Is Strava checkbox enabled?
2. Is token valid and has `activity:read` permission?
3. Are there recent Strava activities?

## OAuth Flow Summary

### 1. Create Strava App (One-time)
- Go to: https://www.strava.com/settings/api
- Create application with callback domain: `127.0.0.1:5001`
- Note Client ID and Client Secret

### 2. Generate Authorization URL
```
https://www.strava.com/oauth/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http://127.0.0.1:5001&approval_prompt=force&scope=activity:read
```

### 3. Customer Completes OAuth
- Customer visits authorization URL
- Customer authorizes application
- Customer gets redirected with authorization code

### 4. Exchange Code for Token
```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=CLIENT_ID \
  -d client_secret=CLIENT_SECRET \
  -d code=AUTHORIZATION_CODE \
  -d grant_type=authorization_code
```

### 5. Test Token
```bash
curl -H "Authorization: Bearer ACCESS_TOKEN" \
  "https://www.strava.com/api/v3/activities?per_page=1"
```

## Common Issues

### Issue: "Authorization Error - missing activity:read_permission"
**Cause**: Token generated without OAuth
**Solution**: Complete OAuth flow

### Issue: "Rate Limit Exceeded"
**Cause**: Too many API requests
**Solution**: Wait 15 minutes

### Issue: "Invalid Application"
**Cause**: Wrong Client ID/Secret or expired authorization code
**Solution**: Check credentials, generate new authorization URL

## Token Properties

- **Expires**: 6 hours
- **Permissions**: `activity:read` (after OAuth)
- **Refresh**: Use refresh token to get new access token

## API Limitations

- **Rate Limits**: 200 requests per 15 minutes, 2,000 daily
- **Read Limits**: 100 requests per 15 minutes, 1,000 daily
- **Best Practice**: Always use date range filtering (app defaults to last 10 days)

## Customer Onboarding Checklist

- [ ] Customer has Strava account
- [ ] You have Client ID and Client Secret
- [ ] Customer completes OAuth flow
- [ ] You exchange code for access token
- [ ] You test token has proper permissions
- [ ] Customer can see Strava workouts in app

## Quick Commands

### Test Token
```bash
curl -H "Authorization: Bearer TOKEN" "https://www.strava.com/api/v3/athlete"
```

### Refresh Token
```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=CLIENT_ID \
  -d client_secret=CLIENT_SECRET \
  -d grant_type=refresh_token \
  -d refresh_token=REFRESH_TOKEN
```

### Get Activities
```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://www.strava.com/api/v3/activities?per_page=5"
```
