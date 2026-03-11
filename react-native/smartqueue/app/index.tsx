import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import OnboardingScreen from '../src/screens/onboarding/OnboardingScreen';

// Données simulées pour l'écran d'accueil
const quickActions = [
  {
    id: 'scan',
    title: 'Scanner QR Code',
    icon: 'qr-code-outline',
    color: '#007AFF',
    onPress: () => router.push('/(tabs)/scan'),
  },
  {
    id: 'explore',
    title: 'Explorer',
    icon: 'map-outline',
    color: '#34C759',
    onPress: () => router.push('/(tabs)'),
  },
  {
    id: 'tickets',
    title: 'Mes Tickets',
    icon: 'ticket-outline',
    color: '#F59E0B',
    onPress: () => router.push('/(tabs)/tickets'),
  },
];

const recentActivity = [
  {
    id: 1,
    establishmentName: 'Banque Populaire',
    serviceName: 'Service Comptes',
    number: 'A42',
    status: 'waiting',
    time: 'Il y a 5 min',
  },
  {
    id: 2,
    establishmentName: 'Clinique Médicale',
    serviceName: 'Consultation',
    number: 'B15',
    status: 'called',
    time: 'Il y a 2 min',
  },
];

export default function Index() {
  return (
    <OnboardingScreen/>
    // <View style={{ flex: 1, backgroundColor: '#F5F5F7' }}>
    //   {/* Header */}
    //   <View style={{
    //     paddingHorizontal: 20,
    //     paddingVertical: 24,
    //     backgroundColor: '#FFFFFF',
    //     borderBottomWidth: 1,
    //     borderBottomColor: '#E5E5EA',
    //   }}>
    //     <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1D1D1F' }}>
    //       SmartQueue
    //     </Text>
    //     <Text style={{ fontSize: 16, color: '#8E8E93', marginTop: 4 }}>
    //       Application de gestion de file d'attente virtuelle
    //     </Text>
    //   </View>

    //   {/* Actions rapides */}
    //   <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
    //     <Text style={{ fontSize: 18, fontWeight: '600', color: '#1D1D1F', marginBottom: 16 }}>
    //       Actions rapides
    //     </Text>
    //     <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    //       {quickActions.map((action) => (
    //         <TouchableOpacity
    //           key={action.id}
    //           style={{
    //             backgroundColor: '#FFFFFF',
    //             borderRadius: 12,
    //             padding: 16,
    //             width: '48%',
    //             shadowColor: '#000',
    //             shadowOffset: { width: 0, height: 2 },
    //             shadowOpacity: 0.1,
    //             shadowRadius: 4,
    //             elevation: 3,
    //             alignItems: 'center',
    //           }}
    //           onPress={action.onPress}
    //         >
    //           <View style={{
    //             width: 40,
    //             height: 40,
    //             borderRadius: 20,
    //             backgroundColor: action.color + '20',
    //             justifyContent: 'center',
    //             alignItems: 'center',
    //             marginBottom: 8,
    //           }}>
    //             <Ionicons name={action.icon} size={20} color="#FFFFFF" />
    //           </View>
    //           <Text style={{ fontSize: 12, color: '#1D1D1F', fontWeight: '500' }}>
    //             {action.title}
    //           </Text>
    //         </TouchableOpacity>
    //       ))}
    //     </View>
    //   </View>

    //   {/* Activité récente */}
    //   <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
    //     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
    //       <Text style={{ fontSize: 18, fontWeight: '600', color: '#1D1D1F' }}>
    //         Activité récente
    //       </Text>
    //       <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
    //         <Text style={{ fontSize: 14, color: '#007AFF' }}>
    //           Voir tout
    //         </Text>
    //       </TouchableOpacity>
    //     </View>

    //     <ScrollView style={{ maxHeight: 300 }}>
    //       {recentActivity.map((activity) => (
    //         <TouchableOpacity
    //           key={activity.id}
    //           style={{
    //             backgroundColor: '#FFFFFF',
    //             borderRadius: 12,
    //             padding: 16,
    //             marginBottom: 12,
    //             shadowColor: '#000',
    //             shadowOffset: { width: 0, height: 2 },
    //             shadowOpacity: 0.1,
    //             shadowRadius: 4,
    //             elevation: 3,
    //           }}
    //           onPress={() => router.push('/(tabs)/live-ticket')}
    //         >
    //           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    //             <View style={{ flex: 1 }}>
    //               <Text style={{ fontSize: 16, fontWeight: '600', color: '#1D1D1F' }}>
    //                 {activity.establishmentName}
    //               </Text>
    //               <Text style={{ fontSize: 14, color: '#8E8E93', marginTop: 2 }}>
    //                 {activity.serviceName} • #{activity.number}
    //               </Text>
    //             </View>
    //             <View style={{ alignItems: 'flex-end' }}>
    //               <Text style={{ 
    //                 fontSize: 12, 
    //                 color: activity.status === 'waiting' ? '#F59E0B' : 
    //                        activity.status === 'called' ? '#007AFF' : '#34C759',
    //                 fontWeight: '500',
    //                 paddingHorizontal: 8,
    //                 paddingVertical: 4,
    //                 backgroundColor: activity.status === 'waiting' ? '#F59E0B20' : 
    //                                  activity.status === 'called' ? '#007AFF20' : '#34C75920',
    //                 borderRadius: 8,
    //               }}>
    //                 {activity.status === 'waiting' ? 'En attente' : 'Appelé'}
    //               </Text>
    //             </View>
    //           </View>
    //           <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }}>
    //             {activity.time}
    //           </Text>
    //         </TouchableOpacity>
    //       ))}
    //     </ScrollView>
    //   </View>

    //   {/* Navigation vers les onglets */}
    //   <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
    //     <TouchableOpacity
    //       style={{
    //         backgroundColor: '#007AFF',
    //         borderRadius: 12,
    //         padding: 16,
    //         alignItems: 'center',
    //         shadowColor: '#000',
    //         shadowOffset: { width: 0, height: 4 },
    //         shadowOpacity: 0.2,
    //         shadowRadius: 8,
    //         elevation: 5,
    //       }}
    //       onPress={() => router.push('/(tabs)')}
    //     >
    //       <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '600' }}>
    //         Accéder à l'application
    //       </Text>
    //     </TouchableOpacity>
    //   </View>
    // </View>
  );
}
