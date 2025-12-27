# ClinicPro Manager - Cloudflare Pages Deployment

## Build Configuration

- **Framework**: Vite + React + TypeScript
- **Build Command**: `npm run build`
- **Build Output**: `dist`
- **Node Version**: 18.x or higher

## Environment Variables

Configure these in Cloudflare Pages dashboard:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## Deployment Steps

### 1. Connect Repository
1. Go to Cloudflare Pages dashboard
2. Click "Create a project"
3. Connect to GitHub repository: `Tchelovb/clinicpro_manager`
4. Select branch: `main`

### 2. Configure Build Settings
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty)
- **Environment variables**: Add the variables listed above

### 3. Deploy
- Click "Save and Deploy"
- Cloudflare will automatically build and deploy
- Subsequent pushes to `main` will trigger automatic deployments

## Custom Domain (Optional)

1. Go to your project settings
2. Navigate to "Custom domains"
3. Add your domain (e.g., `clinicpro.yourdomain.com`)
4. Follow DNS configuration instructions

## Important Notes

- ✅ SPA routing is handled by `_redirects` file
- ✅ All routes redirect to `index.html` for client-side routing
- ✅ Environment variables are injected at build time
- ⚠️ Never commit `.env` files to Git
- ⚠️ Use Cloudflare's environment variable settings for production

## Troubleshooting

### Build Fails
- Check Node version (should be 18.x+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Environment Variables Not Working
- Ensure they're prefixed with `VITE_`
- Rebuild after adding/changing variables
- Check Cloudflare dashboard for correct values

### Routing Issues
- Verify `_redirects` file is in `public` folder
- Check that all routes use React Router's `BrowserRouter`
