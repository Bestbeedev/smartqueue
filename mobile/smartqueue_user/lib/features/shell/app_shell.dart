import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import '../home/home_screen.dart';
import '../tickets/active_tickets_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
import '../services/services_screen.dart';
import '../service_detail/service_detail_screen.dart';
import '../ticket/take_ticket_screen.dart';
import '../realtime/realtime_screen.dart';
import '../queues/queues_screen.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';
import '../../core/app_router.dart';

/// Conteneur avec Bottom Navigation Bar style iOS Cupertino - 5 tabs
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> with TickerProviderStateMixin {
  int currentIndex = 0;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  final homeNavKey = GlobalKey<NavigatorState>();

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: AppTheme.defaultAnimationDuration,
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: _animationController, curve: AppTheme.defaultAnimationCurve),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Route _homeOnGenerate(RouteSettings settings) {
    switch (settings.name) {
      case '/':
      case null:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case AppRouter.services:
        final m = settings.arguments as Map;
        return MaterialPageRoute(
          builder: (_) => ServicesScreen(
            establishmentId: m['establishmentId'] as int,
            establishmentName: m['establishmentName'] as String,
          ),
        );
      case AppRouter.serviceDetail:
        final m = settings.arguments as Map;
        return MaterialPageRoute(
          builder: (_) => ServiceDetailScreen(
            serviceId: m['serviceId'] as int,
            serviceName: m['serviceName'] as String,
          ),
        );
      case AppRouter.takeTicket:
        final m = settings.arguments as Map;
        return MaterialPageRoute(
          builder: (_) => TakeTicketScreen(
            serviceId: m['serviceId'] as int,
            serviceName: m['serviceName'] as String,
          ),
        );
      case AppRouter.realtime:
        final m = settings.arguments as Map;
        return MaterialPageRoute(
          builder: (_) => RealtimeScreen(
            ticketId: m['ticketId'] as int,
            serviceName: m['serviceName'] as String,
            initialTicket: m['ticket'] as dynamic,
          ),
        );
      default:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
    }
  }

  void _onTabTapped(int index) {
    if (index != currentIndex) {
      setState(() {
        currentIndex = index;
      });
      _animationController.reset();
      _animationController.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (currentIndex == 0 &&
            homeNavKey.currentState != null &&
            homeNavKey.currentState!.canPop()) {
          homeNavKey.currentState!.pop();
          return false;
        }
        return true;
      },
      child: Scaffold(
        backgroundColor: AppTheme.backgroundColor,
        body: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: IndexedStack(
              index: currentIndex,
              children: [
                // Home avec navigation imbriquée
                Navigator(
                  key: homeNavKey,
                  onGenerateRoute: (settings) => _homeOnGenerate(settings),
                ),
                // Queues - Available queues
                const QueuesScreen(),
                // Active Ticket - Main core screen
                const ActiveTicketsScreen(),
                // Notifications
                const NotificationsScreen(),
                // Profile
                const ProfileScreen(),
              ],
            ),
          ),
        ),
        bottomNavigationBar: CupertinoBottomNavigationBar(
          currentIndex: currentIndex,
          onTap: _onTabTapped,
        ),
      ),
    );
  }
}
