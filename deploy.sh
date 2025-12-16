#!/bin/bash

# 🚀 Tracko - Employee Performance & Expense Tracking System - Quick Deploy Script

echo "📊 Tracko - Employee Performance & Expense Tracking System - Deployment Script"
echo "=============================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
        return 0
    else
        print_error "Node.js not found. Please install Node.js first."
        return 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm found: $NPM_VERSION"
        return 0
    else
        print_error "npm not found. Please install npm first."
        return 1
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    if npm install; then
        print_status "Dependencies installed successfully"
        return 0
    else
        print_error "Failed to install dependencies"
        return 1
    fi
}

# Run TypeScript compilation check
check_typescript() {
    print_info "Checking TypeScript compilation..."
    if npm run type-check; then
        print_status "TypeScript compilation successful"
        return 0
    else
        print_error "TypeScript compilation failed"
        return 1
    fi
}

# Run tests
run_tests() {
    print_info "Running tests..."
    if npm test -- --passWithNoTests; then
        print_status "All tests passed"
        return 0
    else
        print_warning "Some tests failed, but continuing deployment"
        return 0
    fi
}

# Build verification
build_verification() {
    print_info "Running build verification..."
    if node build-verification.js; then
        print_status "Build verification successful"
        return 0
    else
        print_warning "Build verification had issues, but continuing"
        return 0
    fi
}

# Deploy for Android
deploy_android() {
    print_info "Preparing Android deployment..."
    
    # Check if Android SDK is available
    if command -v adb &> /dev/null; then
        print_status "Android SDK found"
        
        print_info "Starting Metro bundler in background..."
        npm start &
        METRO_PID=$!
        
        sleep 5
        
        print_info "Building and deploying to Android device/emulator..."
        if npm run android; then
            print_status "Android deployment successful!"
            print_info "App should be running on your Android device/emulator"
        else
            print_error "Android deployment failed"
            kill $METRO_PID 2>/dev/null
            return 1
        fi
        
        # Keep Metro running
        print_info "Metro bundler is running (PID: $METRO_PID)"
        print_info "Press Ctrl+C to stop Metro bundler"
        
    else
        print_warning "Android SDK not found"
        print_info "To deploy to Android:"
        print_info "1. Install Android Studio"
        print_info "2. Set up Android SDK"
        print_info "3. Connect device or start emulator"
        print_info "4. Run: npm run android"
    fi
}

# Deploy for iOS
deploy_ios() {
    print_info "Preparing iOS deployment..."
    
    # Check if we're on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Check if Xcode is available
        if command -v xcodebuild &> /dev/null; then
            print_status "Xcode found"
            
            print_info "Installing iOS dependencies..."
            cd ios && pod install && cd ..
            
            print_info "Starting Metro bundler in background..."
            npm start &
            METRO_PID=$!
            
            sleep 5
            
            print_info "Building and deploying to iOS simulator..."
            if npm run ios; then
                print_status "iOS deployment successful!"
                print_info "App should be running on iOS simulator"
            else
                print_error "iOS deployment failed"
                kill $METRO_PID 2>/dev/null
                return 1
            fi
            
            # Keep Metro running
            print_info "Metro bundler is running (PID: $METRO_PID)"
            print_info "Press Ctrl+C to stop Metro bundler"
            
        else
            print_warning "Xcode not found"
            print_info "To deploy to iOS:"
            print_info "1. Install Xcode from App Store"
            print_info "2. Install Xcode command line tools"
            print_info "3. Run: npm run ios"
        fi
    else
        print_warning "iOS deployment requires macOS"
        print_info "You're on a non-Mac system. iOS deployment not available."
    fi
}

# Create production build
create_production_build() {
    print_info "Creating production build..."
    
    # Android production build
    if [ -d "android" ]; then
        print_info "Building Android release APK..."
        cd android
        if ./gradlew assembleRelease; then
            print_status "Android APK created: android/app/build/outputs/apk/release/app-release.apk"
        else
            print_error "Android build failed"
        fi
        cd ..
    fi
    
    # iOS production build would require Xcode
    if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
        print_info "For iOS production build:"
        print_info "1. Open ios/PetrolPumpReconciliation.xcworkspace in Xcode"
        print_info "2. Select 'Any iOS Device' as target"
        print_info "3. Product → Archive"
        print_info "4. Distribute App"
    fi
}

# Main deployment menu
main_menu() {
    echo ""
    echo "Select deployment option:"
    echo "1. 📱 Deploy to Android (Development)"
    echo "2. 📱 Deploy to iOS (Development) - macOS only"
    echo "3. 🏗️  Create Production Build"
    echo "4. 🧪 Run Tests Only"
    echo "5. 📋 Show Deployment Guide"
    echo "6. ❌ Exit"
    echo ""
    
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            deploy_android
            ;;
        2)
            deploy_ios
            ;;
        3)
            create_production_build
            ;;
        4)
            run_tests
            ;;
        5)
            print_info "Opening deployment guide..."
            if command -v cat &> /dev/null; then
                cat DEPLOYMENT_GUIDE.md
            else
                print_info "Please read DEPLOYMENT_GUIDE.md for detailed instructions"
            fi
            ;;
        6)
            print_info "Goodbye! 👋"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please select 1-6."
            main_menu
            ;;
    esac
}

# Main execution
main() {
    echo ""
    print_info "Starting deployment process..."
    
    # Pre-flight checks
    if ! check_node; then
        exit 1
    fi
    
    if ! check_npm; then
        exit 1
    fi
    
    # Install dependencies
    if ! install_dependencies; then
        exit 1
    fi
    
    # Check TypeScript
    if ! check_typescript; then
        print_warning "TypeScript issues found, but continuing..."
    fi
    
    # Run build verification
    build_verification
    
    # Show deployment options
    main_menu
}

# Run main function
main

echo ""
print_status "Deployment script completed!"
print_info "For detailed deployment instructions, see DEPLOYMENT_GUIDE.md"
echo ""