# Offline Plant Disease Detection

A cross-platform application for detecting plant diseases offline using machine learning. Available for Android and Desktop platforms.

## Features

- Offline plant disease detection using TensorFlow.js
- Cross-platform support:
  - Android
  - Windows
  - macOS (untested)
  - Linux (untested)
- Real-time image classification
- User-friendly interface

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- For Android development:
  - [Android Studio](https://developer.android.com/studio)
  - [Java Development Kit (JDK)](https://www.oracle.com/java/technologies/downloads/)
  - Android SDK Platform 33 or higher
  - Android Build Tools
- For Desktop development:
  - Windows, macOS, or Linux operating system
  - Git

## Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/ousecTic/offline-plant-diseases-detection.git
cd offline-plant-diseases-detection
```

2. Install project dependencies:
```bash
npm install
```

## Running the Desktop App (Electron)

1. First-time setup:
```bash
cd electron
npm install
```

2. Development mode:
```bash
npm start
```

3. Build desktop installers:
```bash
npm run make
```
This creates platform-specific installers in `electron/out/make`:
- Windows: `.exe` installer
- Other platforms (untested):
  - macOS: `.dmg` file
  - Linux: `.deb` and `.rpm` packages

## Running the Android App

1. First-time setup:
```bash
# Install Android platform
npm install @capacitor/android
npx cap add android

# Copy web assets
npx cap sync
```

2. Configure Android Studio:
   - Open Android Studio
   - Go to Tools > SDK Manager
   - Install:
     - Android SDK Platform 33 (or higher)
     - Android SDK Build-Tools
     - Android SDK Command-line Tools
     - Android SDK Platform-Tools

3. Run the app:
   - Method 1: Through Android Studio
     ```bash
     npx cap open android
     ```
     Then click the "Run" button in Android Studio

   - Method 2: Command line (with device connected)
     ```bash
     npx cap run android
     ```

## Development Workflow

### Making Changes to the Web App

1. The web app code is in the `www` directory
2. After making changes, sync both platforms:
```bash
npx cap sync
```
This will update both Android and Electron platforms with your latest web app changes.

### Building for Production

#### Desktop App
```bash
cd electron
npm run make
```

#### Android App
1. In Android Studio:
   - Build > Generate Signed Bundle/APK
   - Select APK
   - Create or choose a keystore
   - Choose release build variant
   - APK will be in `android/app/release/`

## Project Structure

```
offline-plant-diseases-detection/
├── android/          # Android platform files
├── electron/         # Desktop platform files
│   ├── app/         # Copied web assets
│   ├── main.js      # Main electron process
│   └── preload.js   # Preload script
└── www/             # Shared web application
    ├── assets/      # Images and resources
    ├── index.html   # Main HTML file
    └── script.js    # Application logic
```

## Troubleshooting

### Android Issues
- Error: "SDK location not found"
  - Set ANDROID_SDK_ROOT environment variable
  - Or create local.properties in android/ with sdk.dir path

- Error: "Failed to find Build Tools"
  - Open Android Studio > Tools > SDK Manager
  - Install/Update Android SDK Build-Tools

### Desktop Issues
- Error: "Cannot find module"
  - Delete node_modules in electron/
  - Run `npm install` in electron/

- Error: "app is not defined"
  - Ensure electron version matches in package.json
  - Try running `npm update` in electron/

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
