import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'Comment rejoindre une file d\'attente ?',
    answer: 'Pour rejoindre une file, scannez le QR code affiché à l\'entrée de l\'établissement avec l\'appareil photo de l\'application, ou entrez manuellement le code à 6 chiffres. Vous pouvez également rechercher l\'établissement dans l\'onglet Explorer et rejoindre la file depuis là.'
  },
  {
    question: 'Puis-je annuler mon ticket ?',
    answer: 'Oui, vous pouvez annuler votre ticket à tout moment avant d\'être appelé. Allez dans l\'onglet Tickets, sélectionnez votre ticket actif et appuyez sur "Annuler le ticket". Attention, cette action est irréversible et vous perdrez votre place dans la file.'
  },
  {
    question: 'Comment fonctionnent les notifications ?',
    answer: 'SmartQueue vous envoie des notifications push lorsque : (1) Vous êtes appelé pour votre tour, (2) Il reste peu de personnes avant vous (alerte "bientôt votre tour"), (3) Vous avez activé l\'alerte de sécurité 2 minutes avant. Assurez-vous d\'activer les notifications dans les paramètres de l\'application.'
  },
  {
    question: 'Que se passe-t-il si je manque mon tour ?',
    answer: 'Si vous n\'êtes pas présent lorsque votre numéro est appelé, votre ticket sera marqué comme "absent" après un délai de grâce (généralement 2-3 minutes). Vous devrez alors prendre un nouveau ticket si vous souhaitez toujours être servi.'
  },
  {
    question: 'Comment fonctionne le calcul du temps d\'attente ?',
    answer: 'Le temps d\'attente estimé est calculé en fonction du nombre de personnes devant vous, du temps moyen de service par type de service, et du mode de transport que vous avez sélectionné (à pied, moto, voiture). Ce temps est mis à jour en temps réel.'
  },
  {
    question: 'Puis-je réserver à l\'avance ?',
    answer: 'Actuellement, SmartQueue ne propose pas de réservation à l\'avance. Vous rejoignez la file en temps réel lorsque vous arrivez à proximité de l\'établissement. Cette fonctionnalité sera peut-être disponible dans une future version.'
  }
];

const FAQAccordion: React.FC<{ item: FAQItem; isOpen: boolean; onPress: () => void }> = ({ 
  item, 
  isOpen, 
  onPress 
}) => {
  const [animation] = useState(new Animated.Value(0));
  
  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const heightInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={styles.faqContainer}>
      <TouchableOpacity 
        style={[styles.faqHeader, isOpen && styles.faqHeaderOpen]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.faqQuestion, isOpen && styles.faqQuestionOpen]}>
          {item.question}
        </Text>
        <Animated.View style={{
          transform: [{
            rotate: animation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '180deg'],
            })
          }]
        }}>
          <Ionicons name="chevron-down" size={24} color={isOpen ? '#3B82F6' : '#64748B'} />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View style={[styles.faqAnswerContainer, { height: heightInterpolate }]}>
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      </Animated.View>
    </View>
  );
};

export const HelpSupportScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.iconButton}
            activeOpacity={0.8}
          >
            <View style={styles.iconButtonBg}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aide & Support</Text>
          <View style={styles.iconButton} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactez-nous</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity 
              style={styles.contactCard}
              onPress={() => Linking.openURL('mailto:support@smartqueue.com')}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="mail" size={28} color="#3B82F6" />
              </View>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@smartqueue.com</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactCard}
              onPress={() => Linking.openURL('tel:+33123456789')}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="call" size={28} color="#10B981" />
              </View>
              <Text style={styles.contactLabel}>Téléphone</Text>
              <Text style={styles.contactValue}>+33 1 23 45 67 89</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          <View style={styles.faqCard}>
            {faqData.map((item, index) => (
              <FAQAccordion
                key={index}
                item={item}
                isOpen={openFAQ === index}
                onPress={() => toggleFAQ(index)}
              />
            ))}
          </View>
        </View>

        {/* Support Hours */}
        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={24} color="#8B5CF6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Heures de support</Text>
            <Text style={styles.infoText}>Lun - Ven: 9h00 - 18h00</Text>
            <Text style={styles.infoText}>Sam: 10h00 - 14h00</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
  },
  iconButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  faqContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  faqHeaderOpen: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  faqQuestionOpen: {
    color: '#3B82F6',
  },
  faqAnswerContainer: {
    overflow: 'hidden',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  infoContent: {
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#8B5CF6',
  },
});

export default HelpSupportScreen;

