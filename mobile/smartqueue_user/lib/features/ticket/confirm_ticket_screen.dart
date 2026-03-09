import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../../data/models/service.dart';
import '../../data/models/ticket.dart';
import '../tickets/active_tickets_screen.dart';

class ConfirmTicketScreen extends ConsumerStatefulWidget {
  final String establishmentName;
  final String serviceName;
  final int serviceId;

  const ConfirmTicketScreen({
    super.key,
    required this.establishmentName,
    required this.serviceName,
    required this.serviceId,
  });

  @override
  ConsumerState<ConfirmTicketScreen> createState() => _ConfirmTicketScreenState();
}

class _ConfirmTicketScreenState extends ConsumerState<ConfirmTicketScreen> {
  bool _isLoading = false;
  int? _estimatedWait;
  int? _peopleAhead;

  @override
  void initState() {
    super.initState();
    _generateEstimates();
  }

  void _generateEstimates() {
    // Simulate generating estimates based on service
    setState(() {
      _estimatedWait = 10 + (widget.serviceId % 20);
      _peopleAhead = 3 + (widget.serviceId % 10);
    });
  }

  Future<void> _confirmTicket() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Simulate API call to create ticket
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        // Navigate to active ticket screen
        Navigator.of(context).pushAndRemoveUntil(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) => const ActiveTicketsScreen(),
            transitionDuration: const Duration(milliseconds: 500),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              return FadeTransition(
                opacity: animation,
                child: child,
              );
            },
          ),
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        showCupertinoDialog(
          context: context,
          builder: (context) => CupertinoAlertDialog(
            title: const Text('Error'),
            content: Text('Failed to create ticket: $e'),
            actions: [
              CupertinoDialogAction(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _cancel() {
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 16,
                right: 16,
                bottom: 16,
              ),
              child: Row(
                children: [
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: _cancel,
                    child: const Icon(
                      CupertinoIcons.back,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      'Confirm Ticket',
                      style: AppTheme.title1.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(width: 40), // Balance the back button
                ],
              ),
            ),

            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Ticket summary card
                    CupertinoCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ticket Summary',
                            style: AppTheme.headline.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          
                          const SizedBox(height: 20),
                          
                          // Establishment
                          _buildInfoRow(
                            icon: CupertinoIcons.building_2_fill,
                            label: 'Establishment',
                            value: widget.establishmentName,
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Service
                          _buildInfoRow(
                            icon: CupertinoIcons.ticket_fill,
                            label: 'Service',
                            value: widget.serviceName,
                          ),
                          
                          const SizedBox(height: 24),
                          
                          // Divider
                          Container(
                            height: 1,
                            color: AppTheme.dividerColor.withOpacity(0.3),
                          ),
                          
                          const SizedBox(height: 24),
                          
                          // Estimated wait
                          if (_estimatedWait != null)
                            _buildInfoRow(
                              icon: CupertinoIcons.time,
                              label: 'Estimated wait',
                              value: '$_estimatedWait min',
                              valueColor: AppTheme.primaryColor,
                            ),
                          
                          if (_estimatedWait != null && _peopleAhead != null)
                            const SizedBox(height: 16),
                          
                          // People ahead
                          if (_peopleAhead != null)
                            _buildInfoRow(
                              icon: CupertinoIcons.person_2,
                              label: 'People ahead',
                              value: '$_peopleAhead',
                              valueColor: AppTheme.warningColor,
                            ),
                        ],
                      ),
                    ),

                    const Spacer(),

                    // Action buttons
                    Column(
                      children: [
                        // Confirm button
                        SizedBox(
                          width: double.infinity,
                          child: CupertinoButtonCustom(
                            onPressed: _isLoading ? null : _confirmTicket,
                            filled: true,
                            child: _isLoading
                                ? const CupertinoActivityIndicator(radius: 10)
                                : Text(
                                    'Confirm Ticket',
                                    style: AppTheme.button.copyWith(
                                      color: Colors.white,
                                    ),
                                  ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Cancel button
                        SizedBox(
                          width: double.infinity,
                          child: CupertinoButtonCustom(
                            onPressed: _isLoading ? null : _cancel,
                            child: Text(
                              'Cancel',
                              style: AppTheme.button.copyWith(
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: AppTheme.textSecondary,
        ),
        const SizedBox(width: 12),
        Text(
          label,
          style: AppTheme.body.copyWith(
            color: AppTheme.textSecondary,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: AppTheme.body.copyWith(
            color: valueColor ?? AppTheme.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
