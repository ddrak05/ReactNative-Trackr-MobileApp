# Trackr Mobile App

A personal finance tracker build with Expo and React Native. Track monthly income and expenses and visualize spending with interactive charts.

## 🚀 Features

* **Logging**: Easily add, edit and categorize income and expenses
* **Recurring Payments**: Get remimders of upcoming monthly subscriptions and bills
* **Data Visualization**: View monthly spending habits with interactive pie charts and breakdowns based on their category
* **Transaction History**: Navigate through past months and filter transactions by category or type
* **Local Persistence**: All data is saved locally on your device using AsyncStorage
* 
## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/ddrak05/trackr.git](https://github.com/ddrak05/trackr.git)
    cd trackr
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the app**:
    ```bash
    npx expo start
    ```
    
4. **Previw**:
   Scan the **QR code** displayed in your terminal using the [Expo Go](https://expo.dev/go) app (Android) or the
   Camera app (iOS).

## 🛠️ Tech Stack

* **Framework**: [Expo](https://expo.dev) / [React Native](https://reactnative.dev)
* **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction) (File-based routing)
* **Charts**: `react-native-gifted-charts`
* **Icons**: `@expo/vector-icons` (Ionicons)
* **Storage**: `@react-native-async-storage/async-storage`
