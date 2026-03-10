// features/ticket/take_ticket_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartqueue_user/core/app_theme.dart';
import 'package:smartqueue_user/core/app_router.dart';
import 'package:smartqueue_user/features/ticket/ticket_provider.dart';

class TakeTicketScreen extends ConsumerWidget {
  final int serviceId;
  final String serviceName;

  const TakeTicketScreen({
    super.key,
    required this.serviceId,
    required this.serviceName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTicket = ref.watch(ticketProvider);

    int? extractExistingTicketId(Object error) {
      final s = error.toString();
      final m = RegExp(r'existingTicketId:(\d+)').firstMatch(s);
      if (m == null) return null;
      return int.tryParse(m.group(1) ?? '');
    }

    String cleanedErrorText(Object error) {
      final s = error.toString().replaceAll('Exception: ', '');
      return s
          .replaceAll(RegExp(r'\n?existingTicketId:\d+'), '')
          .trim();
    }

    Widget centeredConstrained(Widget child) {
      return Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: child,
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Prendre un ticket • $serviceName'),
      ),
      body: asyncTicket.when(
          data: (ticket) {
            if (ticket == null) {
              return centeredConstrained(
                SingleChildScrollView(
                  child: Column(
                    children: [
                      const SizedBox(height: 8),
                      const Icon(
                        Icons.confirmation_number_outlined,
                        size: 72,
                        color: AppTheme.primaryColor,
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Prendre un ticket',
                        style: Theme.of(context).textTheme.headlineSmall,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Souhaitez-vous prendre un ticket pour ce service ?',
                        textAlign: TextAlign.center,
                        style: AppTheme.bodyMedium,
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () =>
                              ref.read(ticketProvider.notifier).take(serviceId),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text(
                            'Confirmer',
                            style: TextStyle(fontSize: 16),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: const Text('Annuler'),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              );
            }

            return centeredConstrained(
              SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 8),
                    Container(
                      width: 104,
                      height: 104,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.verified_outlined,
                        size: 56,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Ticket créé',
                      style: Theme.of(context).textTheme.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      serviceName,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 20),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Text(
                              'Numéro de ticket',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                ticket.ticketNumber,
                                style: const TextStyle(
                                  fontSize: 56,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => Navigator.pushReplacementNamed(
                          context,
                          AppRouter.realtime,
                          arguments: {
                            'ticketId': ticket.id,
                            'serviceName': serviceName,
                            'ticket': ticket,
                          },
                        ),
                        icon: const Icon(Icons.timer_outlined),
                        label: const Text('Suivre en temps réel'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.home_outlined),
                        label: const Text('Retour à l\'accueil'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            );
          },
          loading: () => const CircularProgressIndicator(),
          error: (error, _) {
            final existingId = extractExistingTicketId(error);
            return centeredConstrained(
              SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 8),
                    const Icon(
                      Icons.error_outline,
                      size: 56,
                      color: AppTheme.errorColor,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Erreur lors de la prise de ticket',
                      style: Theme.of(context).textTheme.titleLarge,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      cleanedErrorText(error),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 20),
                    if (existingId != null) ...[
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.pushReplacementNamed(
                              context,
                              AppRouter.realtime,
                              arguments: {
                                'ticketId': existingId,
                                'serviceName': serviceName,
                              },
                            );
                          },
                          icon: const Icon(Icons.timer_outlined),
                          label: const Text('Ouvrir mon ticket actif'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => ref.refresh(ticketProvider),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Réessayer'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: const Text('Retour'),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            );
          },
        ),
    );
  }
}