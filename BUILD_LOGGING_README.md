# Enhanced Build Logging System for Cloudflare Pages

## 🎯 **Overview**

This enhanced build system provides comprehensive logging and debugging capabilities for Cloudflare Pages deployments. It addresses the issue of Cloudflare build logs disappearing quickly by capturing all build information locally.

## 🚀 **Available Build Commands**

### **Basic Commands**

```bash
# Standard build
npm run build:cf

# Verbose build with enhanced logging
npm run build:cf:verbose

# Debug build with full DEBUG output
npm run build:cf:debug

# Enhanced build with comprehensive logging (RECOMMENDED)
npm run build:cf:logs

# Build and deploy with logging
npm run build:cf:deploy
```

### **Enhanced Build Script**

```bash
# Run the comprehensive build script
./scripts/build-with-logs.sh

# Build and deploy in one command
./scripts/build-with-logs.sh --deploy
```

## 📁 **Log File Structure**

```
build-logs/
├── build_20240822_172346.log          # Timestamped build log
├── errors_20240822_172346.log         # Error-specific log
├── latest_build.log                   # Symlink to latest build
└── latest_errors.log                  # Symlink to latest errors
```

## 🔍 **What Gets Logged**

### **System Information**

- Node.js and npm versions
- Git branch and commit information
- Available memory and system resources
- Working directory details

### **Build Process**

- Dependency installation
- Linting results
- Test execution
- Next.js build process
- Cloudflare Pages build process
- Build output verification

### **Performance Metrics**

- Build duration
- Output file sizes
- Number of generated files
- Memory usage during build

### **Error Tracking**

- Detailed error messages
- Stack traces
- Warning messages
- Build failure analysis

## 🛠️ **Configuration Files**

### **Next.js Config (`next.config.mjs`)**

- Enhanced logging configuration
- Verbose webpack logging
- Better source maps
- Build timestamp injection

### **Wrangler Config (`wrangler.jsonc`)**

- Debug logging enabled
- Source maps enabled
- Verbose output
- Enhanced error reporting

### **VS Code Debug Config (`.vscode/launch.json`)**

- Debug configurations for build processes
- Environment variable setup
- Breakpoint support

## 📊 **Using the Enhanced Build System**

### **1. Standard Build with Logging**

```bash
npm run build:cf:logs
```

This will:

- Clean previous builds
- Run linting and tests
- Build Next.js with verbose logging
- Build for Cloudflare Pages with comprehensive logging
- Save all logs to `build-logs/` directory
- Provide a summary of the build process

### **2. Build and Deploy**

```bash
npm run build:cf:deploy
```

This will:

- Perform the full build process
- Automatically deploy to Cloudflare Pages
- Log the entire deployment process

### **3. Manual Script Execution**

```bash
# Make script executable (first time only)
chmod +x scripts/build-with-logs.sh

# Run with custom options
./scripts/build-with-logs.sh --deploy
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Build Logs Not Generated**

- Ensure the script has execute permissions: `chmod +x scripts/build-with-logs.sh`
- Check that the `build-logs/` directory exists
- Verify Node.js and npm are properly installed

#### **Verbose Logging Not Working**

- Check that `DEBUG=*` environment variable is set
- Ensure `--verbose` flag is passed to Cloudflare build
- Verify Next.js config has enhanced logging enabled

#### **Deployment Issues**

- Check Wrangler authentication: `wrangler login`
- Verify project name in `wrangler.jsonc`
- Check Cloudflare Pages project exists

### **Debug Mode**

```bash
# Enable full debug output
DEBUG=* npm run build:cf:debug

# Check environment variables
echo $DEBUG
echo $NODE_ENV
echo $CF_PAGES_BRANCH
```

## 📈 **Performance Monitoring**

### **Build Metrics**

The enhanced build system tracks:

- Total build time
- Individual step durations
- Memory usage
- File generation counts
- Output sizes

### **Optimization Tips**

- Use `npm run build:cf:logs` for development
- Use `npm run build:cf:deploy` for production
- Check logs for performance bottlenecks
- Monitor memory usage during builds

## 🔄 **Continuous Integration**

### **GitHub Actions Example**

```yaml
- name: Build with Enhanced Logging
  run: npm run build:cf:logs

- name: Upload Build Logs
  uses: actions/upload-artifact@v3
  with:
    name: build-logs
    path: build-logs/
```

### **Environment Variables**

```bash
# Set in CI/CD
export DEBUG="*"
export NODE_ENV="production"
export CF_PAGES_BRANCH="staging"
export ENABLE_VERBOSE_LOGGING="true"
```

## 📚 **Best Practices**

### **Development**

1. Always use `npm run build:cf:logs` for local builds
2. Check logs immediately after build completion
3. Use VS Code debug configurations for step-by-step debugging
4. Monitor build performance over time

### **Production**

1. Use `npm run build:cf:deploy` for automated deployments
2. Archive build logs for historical analysis
3. Set up alerts for build failures
4. Monitor build duration trends

### **Maintenance**

1. Regularly clean old log files
2. Monitor log directory size
3. Update build scripts as dependencies change
4. Review and optimize build configurations

## 🆘 **Support**

### **Getting Help**

- Check the `build-logs/` directory for detailed error information
- Review the Next.js and Cloudflare Pages documentation
- Use VS Code debug configurations for step-by-step analysis
- Check the console output for real-time build information

### **Log Analysis**

- Look for `[ERROR]` entries in error logs
- Check `[WARNING]` messages for potential issues
- Review build timing information for performance issues
- Analyze file generation counts for build completeness

---

**Last Updated**: August 22, 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team
