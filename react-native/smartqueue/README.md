# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Notifications push (FCM) — configuration requise

Le code applicatif (handler foreground, canal Android, enregistrement du token,
gestion du tap) est désormais monté automatiquement via
`src/components/NotificationsProvider.tsx` (inclus dans `app/_layout.tsx`).

Pour que les notifications s'affichent réellement sur un build natif Android, il
faut fournir les identifiants Firebase — **sans eux, `getExpoPushTokenAsync` /
`getDevicePushTokenAsync` échoue avec « Default FirebaseApp is not
initialized »** :

1. Créer un projet Firebase et y ajouter une app Android avec le package
   `com.bestbeedev.smartqueue` (et une app iOS avec le bundle id si besoin).
2. Télécharger `google-services.json` et le placer à la racine du dossier
   `react-native/smartqueue/` (ou pointer dessus via la variable d'env
   `GOOGLE_SERVICES_JSON`). `app.config.js` ajoute alors automatiquement
   `android.googleServicesFile`. Idem iOS avec `GoogleService-Info.plist` /
   `GOOGLE_SERVICES_INFO_PLIST`.
3. Côté backend, renseigner `FIREBASE_SERVICE_ACCOUNT_JSON` (clé de compte de
   service Firebase) pour l'envoi via FCM HTTP v1. Le chemin « token Expo »
   fonctionne sans cette clé mais nécessite que les identifiants FCM soient
   téléversés sur EAS (`eas credentials`).
4. Reconstruire l'app (`eas build` ou `npx expo run:android`) — un OTA ne suffit
   pas car `google-services.json` est intégré au binaire natif.

Le canal Android utilisé est `smartqueue-default` (importance MAX) ; le backend
envoie `android.notification.channel_id = "smartqueue-default"` pour un affichage
heads-up en arrière-plan / app fermée.

> iOS : `ios.bundleIdentifier` est `com.bestbeedev.smartqueue`. Pour le push iOS,
> ajouter aussi `GoogleService-Info.plist` et configurer la clé APNs sur EAS.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
