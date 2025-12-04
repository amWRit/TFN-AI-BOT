# 🚀 Deployment Checklist - TFN-AI

## Pre-Deployment (Local Testing)

### Environment Setup
- [ ] Python 3.8+ installed
- [ ] Node.js 18+ installed
- [ ] AWS account with Bedrock access
- [ ] AWS credentials obtained (Access Key + Secret)

### Dependencies Installation
- [ ] Python packages installed:
  ```bash
  pip install pypdf langchain-text-splitters langchain-community
  ```
- [ ] npm dependencies installed:
  ```bash
  npm install
  ```

### Document Processing
- [ ] PDF files placed in project root
- [ ] Preprocessing completed:
  ```bash
  python preprocess_docs.py
  ```
- [ ] `public/tfn-documents.json` generated successfully
- [ ] JSON file contains expected number of chunks

### Local Configuration
- [ ] `.env.local` file created from `.env.local.example`
- [ ] AWS credentials filled in:
  - [ ] `AWS_REGION` (e.g., us-east-1)
  - [ ] `AWS_ACCESS_KEY_ID` filled
  - [ ] `AWS_SECRET_ACCESS_KEY` filled
  - [ ] `AWS_SESSION_TOKEN` (if using temporary creds)
- [ ] `BEDROCK_MODEL_ID` set (default: amazon.nova-lite-v1:0)
- [ ] `LLM_TEMPERATURE` set (default: 0.1)

### Local Testing
- [ ] Dev server starts without errors:
  ```bash
  npm run dev
  ```
- [ ] UI loads at `http://localhost:3000`
- [ ] Chat interface is functional
- [ ] Quick action buttons work
- [ ] Can type and submit queries
- [ ] API responds with answers
- [ ] Source citations appear
- [ ] No console errors in browser
- [ ] No errors in server logs

### API Testing
- [ ] Test with curl/Postman:
  ```bash
  curl -X POST http://localhost:3000/api/rag-alumni \
    -H "Content-Type: application/json" \
    -d '{"query": "What are TFN programs?"}'
  ```
- [ ] Response includes: answer, sources, totalDocs
- [ ] Sources have: source filename, page number
- [ ] Error messages are descriptive

### Code Review
- [ ] `preprocess_docs.py` handles PDFs correctly
- [ ] `app/api/rag-alumni/route.js` has proper error handling
- [ ] All imports are correct
- [ ] No console.log statements left (or minimal)
- [ ] All environment variables are used

---

## Pre-Production (Before Vercel)

### Code Quality
- [ ] Lint check passes:
  ```bash
  npm run lint
  ```
- [ ] No TypeScript errors (if applicable)
- [ ] No security vulnerabilities
- [ ] `.env.local` is in `.gitignore`

### Git Preparation
- [ ] `.env.local` NOT committed
- [ ] `.env.local.example` is committed
- [ ] `public/tfn-documents.json` is committed
- [ ] All source files committed
- [ ] No node_modules committed
- [ ] `.next` folder is in `.gitignore`
- [ ] All large files are tracked

### Performance Optimization
- [ ] First query response time acceptable (30-60s is normal)
- [ ] Subsequent queries fast (2-5s)
- [ ] No memory leaks in long sessions
- [ ] Proper error recovery

### Security Review
- [ ] AWS credentials never hardcoded in code
- [ ] `.env.local` contains only your credentials
- [ ] Secrets not in git history
- [ ] API validation on query input
- [ ] Error messages don't leak sensitive info

---

## Vercel Deployment

### Vercel Setup
- [ ] Vercel account created
- [ ] Project connected to GitHub repo
- [ ] GitHub repo is public or Vercel has access

### Environment Variables in Vercel
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add the following variables:
   - [ ] `AWS_REGION` = your_region (e.g., us-east-1)
   - [ ] `AWS_ACCESS_KEY_ID` = your_access_key
   - [ ] `AWS_SECRET_ACCESS_KEY` = your_secret_key
   - [ ] `AWS_SESSION_TOKEN` = your_session_token (if applicable)
   - [ ] `BEDROCK_MODEL_ID` = amazon.nova-lite-v1:0 (optional)
   - [ ] `LLM_TEMPERATURE` = 0.1 (optional)

### Build Configuration
- [ ] Build command set to: `npm run build`
- [ ] Output directory: `.next` (default)
- [ ] Install command: `npm install` (default)
- [ ] Node.js version: 18.x or higher

### Pre-deployment Build
- [ ] Local build succeeds:
  ```bash
  npm run build
  ```
- [ ] Build output shows success
- [ ] No warnings or errors

### Deployment
- [ ] Push to GitHub
- [ ] Vercel auto-deploys
- [ ] Deployment logs show success
- [ ] No build errors
- [ ] Preview URL works

### Post-Deployment Testing
- [ ] Visit Vercel deployment URL
- [ ] UI loads correctly
- [ ] Chat interface functional
- [ ] Query returns answer with sources
- [ ] No console errors
- [ ] Images load correctly
- [ ] Styling applied properly

---

## Production Monitoring

### Performance Monitoring
- [ ] Set up AWS CloudWatch alerts for:
  - [ ] Bedrock API errors
  - [ ] Cost thresholds
  - [ ] Request latency
- [ ] Monitor Vercel logs:
  - [ ] Error rates
  - [ ] Function duration
  - [ ] Memory usage

### Cost Monitoring
- [ ] AWS Console → Billing and Cost Management
- [ ] Set up cost anomaly detection
- [ ] Review daily/weekly usage
- [ ] Set spending limits if available

### Error Tracking
- [ ] Set up error tracking (Sentry, etc.) to catch:
  - [ ] API errors
  - [ ] LLM failures
  - [ ] Vector store issues
- [ ] Create alerting rules
- [ ] Set up incident response process

### Usage Analytics
- [ ] Track query volume
- [ ] Monitor response quality
- [ ] Collect user feedback
- [ ] A/B test different models if applicable

---

## Post-Deployment Updates

### Updating PDFs
When adding new PDFs:
1. Add PDF files to project locally
2. Run: `python preprocess_docs.py`
3. Commit and push: `git push`
4. Vercel auto-deploys
5. New PDFs available in production

### Updating Model Configuration
To change LLM model:
1. Update in Vercel Dashboard → Settings → Environment Variables
2. Change `BEDROCK_MODEL_ID`
3. Deployment restarts automatically
4. Test new model behavior

### Updating Prompt Template
To modify system prompt:
1. Edit `app/api/rag-alumni/route.js`
2. Modify the `ChatPromptTemplate.fromTemplate()` section
3. Commit and push
4. Vercel redeploys

---

## Rollback Plan

If issues occur in production:

### Quick Rollback (Vercel)
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"
4. Old version live within seconds

### Document Rollback
If new PDFs cause issues:
1. Revert commits or remove problematic PDFs
2. Run `python preprocess_docs.py` locally
3. Commit updated `public/tfn-documents.json`
4. Push to trigger redeployment

### Configuration Rollback
If environment variables cause issues:
1. Go to Vercel Settings → Environment Variables
2. Revert to previous values
3. Redeploy (or restart)

---

## Maintenance Schedule

### Daily
- [ ] Monitor error logs
- [ ] Check AWS costs
- [ ] Verify API responding

### Weekly
- [ ] Review usage analytics
- [ ] Check for new AWS issues
- [ ] Test with new queries

### Monthly
- [ ] Review performance metrics
- [ ] Update documentation if needed
- [ ] Consider model/cost optimizations
- [ ] Backup important data

### Quarterly
- [ ] Review and update PDFs
- [ ] Test disaster recovery
- [ ] Performance tuning if needed
- [ ] Security audit

---

## Troubleshooting in Production

### Issue: API Returns 500 Error
**Checklist:**
- [ ] Check Vercel logs for error details
- [ ] Verify AWS credentials haven't expired
- [ ] Check AWS Bedrock service status
- [ ] Verify AWS region is correct
- [ ] Check if Bedrock model still exists

### Issue: Slow Responses
**Checklist:**
- [ ] Check AWS Lambda/Bedrock metrics
- [ ] Verify network latency
- [ ] Check if vector store is cached
- [ ] Consider switching to faster model

### Issue: Incorrect Answers
**Checklist:**
- [ ] Check if PDFs were processed correctly
- [ ] Verify document chunks in `tfn-documents.json`
- [ ] Test with mock mode to isolate issue
- [ ] Try a different LLM model

### Issue: High AWS Bills
**Checklist:**
- [ ] Review Bedrock usage metrics
- [ ] Check for API call loops
- [ ] Consider cheaper models
- [ ] Reduce chunk retrieval (k=3 default)

---

## Success Metrics

After deployment, track these metrics:

- [ ] API response time < 10 seconds (after warm-up)
- [ ] Success rate > 99%
- [ ] Error rate < 1%
- [ ] User satisfaction > 4/5 (if collecting feedback)
- [ ] AWS costs < $X/month (define your budget)
- [ ] Uptime > 99.5%

---

## Final Verification Checklist

Before declaring production-ready:

- [ ] All tests pass locally
- [ ] Deployment succeeds without errors
- [ ] Production URL works
- [ ] API responds correctly
- [ ] Error handling works
- [ ] AWS credentials secure
- [ ] Monitoring set up
- [ ] Backup plan documented
- [ ] Team trained on deployment
- [ ] Documentation up to date

---

## Contact & Support

**Issues During Deployment?**

1. Check SETUP_GUIDE.md → Troubleshooting
2. Check README_RAG.md → Troubleshooting
3. Review Vercel logs: Vercel Dashboard → Deployments
4. Review AWS CloudWatch logs for Bedrock errors
5. Check browser console (F12 → Console tab)

**References:**
- Vercel Docs: https://vercel.com/docs
- AWS Bedrock: https://docs.aws.amazon.com/bedrock/
- LangChain AWS: https://python.langchain.com/docs/integrations/llms/bedrock

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Status:** [ ] Pre-Production  [ ] Production  [ ] Archived  

---

✅ Ready to deploy!
