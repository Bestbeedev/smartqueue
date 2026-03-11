import { useLocalSearchParams } from 'expo-router';
import { LiveTicketScreen as VQSLiveTicketScreen } from '../../src/screens/tickets/LiveTicketScreen';

export default function LiveTicket() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  return <VQSLiveTicketScreen ticketId={ticketId} />;
}
