import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_theme.dart';
import '../../core/widgets/cupertino_widgets.dart';

/// Predictive Waiting Screen - AI-powered wait time predictions
class PredictiveWaitingScreen extends ConsumerStatefulWidget {
  const PredictiveWaitingScreen({super.key});

  @override
  ConsumerState<PredictiveWaitingScreen> createState() =>
      _PredictiveWaitingScreenState();
}

class _PredictiveWaitingScreenState
    extends ConsumerState<PredictiveWaitingScreen> {
  bool _isAnalyzing = false;
  PredictionResult? _prediction;
  String _selectedTimeRange = 'today';

  @override
  void initState() {
    super.initState();
    _runPrediction();
  }

  void _runPrediction() {
    setState(() {
      _isAnalyzing = true;
      _prediction = null;
    });

    // Simulate AI prediction
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _isAnalyzing = false;
        _prediction = PredictionResult(
          bestTimeToVisit: '14:30',
          expectedWaitTime: 8,
          confidenceLevel: 92,
          factors: [
            PredictionFactor('Low crowd', 0.8, AppTheme.successColor),
            PredictionFactor('Weekday', 0.6, AppTheme.primaryColor),
            PredictionFactor('Weather', 0.4, AppTheme.warningColor),
          ],
          recommendations: [
            'Visit between 2:00 PM - 3:00 PM for shortest wait',
            'Avoid peak hours 12:00 PM - 1:00 PM',
            'Tuesday and Wednesday are typically less crowded',
          ],
          hourlyPredictions: _generateHourlyPredictions(),
        );
      });
    });
  }

  List<HourlyPrediction> _generateHourlyPredictions() {
    return [
      HourlyPrediction('09:00', 5),
      HourlyPrediction('10:00', 8),
      HourlyPrediction('11:00', 15),
      HourlyPrediction('12:00', 25),
      HourlyPrediction('13:00', 22),
      HourlyPrediction('14:00', 12),
      HourlyPrediction('15:00', 10),
      HourlyPrediction('16:00', 18),
      HourlyPrediction('17:00', 20),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Container(
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
                    onPressed: () => Navigator.pop(context),
                    child: const Icon(
                      CupertinoIcons.back,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'AI PREDICTIONS',
                    style: AppTheme.title3.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const Spacer(),
                  CupertinoButton(
                    padding: EdgeInsets.zero,
                    onPressed: _runPrediction,
                    child: const Icon(
                      CupertinoIcons.refresh,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          if (_isAnalyzing)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CupertinoActivityIndicator(radius: 20),
                    SizedBox(height: 16),
                    Text(
                      'AI is analyzing patterns...',
                      style: AppTheme.callout,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'This may take a moment',
                      style: AppTheme.caption1.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else if (_prediction != null)
            SliverList(
              delegate: SliverChildListDelegate([
                // Main prediction card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: AppTheme.primaryGradient,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // AI badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                CupertinoIcons.settings,
                                color: Colors.white,
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'AI POWERED',
                                style: AppTheme.caption1.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Best time to visit
                        Text(
                          'Best Time to Visit',
                          style: AppTheme.callout.copyWith(
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _prediction!.bestTimeToVisit,
                          style: const TextStyle(
                            fontSize: 48,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Expected wait time
                        Text(
                          'Expected Wait: ${_prediction!.expectedWaitTime} min',
                          style: AppTheme.body.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),

                        const SizedBox(height: 4),

                        // Confidence level
                        Text(
                          '${_prediction!.confidenceLevel}% confidence',
                          style: AppTheme.caption1.copyWith(
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Hourly predictions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Hourly Predictions',
                    style: AppTheme.headline.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppTheme.dividerColor.withOpacity(0.3),
                      ),
                    ),
                    child: Column(
                      children: [
                        // Chart placeholder
                        Container(
                          height: 200,
                          decoration: BoxDecoration(
                            color: AppTheme.backgroundColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                CupertinoIcons.chart_bar,
                                size: 60,
                                color: AppTheme.primaryColor.withOpacity(0.3),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Wait Time Chart',
                                style: AppTheme.callout.copyWith(
                                  color:
                                      AppTheme.textSecondary.withOpacity(0.5),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Hourly list
                        ..._prediction!.hourlyPredictions.map((prediction) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                Text(
                                  prediction.time,
                                  style: AppTheme.callout.copyWith(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const Spacer(),
                                Container(
                                  width: 100,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: AppTheme.backgroundColor,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: FractionallySizedBox(
                                    alignment: Alignment.centerLeft,
                                    widthFactor: prediction.waitTime / 25.0,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        gradient: AppTheme.primaryGradient,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '${prediction.waitTime}m',
                                  style: AppTheme.caption1.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Influencing factors
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Influencing Factors',
                    style: AppTheme.headline.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppTheme.dividerColor.withOpacity(0.3),
                      ),
                    ),
                    child: Column(
                      children: _prediction!.factors.map((factor) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            children: [
                              Container(
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  color: factor.color,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  factor.name,
                                  style: AppTheme.callout.copyWith(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              Text(
                                '${(factor.impact * 100).toInt()}%',
                                style: AppTheme.callout.copyWith(
                                  color: factor.color,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Recommendations
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'AI Recommendations',
                    style: AppTheme.headline.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppTheme.dividerColor.withOpacity(0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children:
                          _prediction!.recommendations.map((recommendation) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                CupertinoIcons.lightbulb,
                                color: AppTheme.warningColor,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  recommendation,
                                  style: AppTheme.callout,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

                const SizedBox(height: 32),
              ]),
            ),
        ],
      ),
    );
  }
}

class PredictionResult {
  final String bestTimeToVisit;
  final int expectedWaitTime;
  final int confidenceLevel;
  final List<PredictionFactor> factors;
  final List<String> recommendations;
  final List<HourlyPrediction> hourlyPredictions;

  PredictionResult({
    required this.bestTimeToVisit,
    required this.expectedWaitTime,
    required this.confidenceLevel,
    required this.factors,
    required this.recommendations,
    required this.hourlyPredictions,
  });
}

class PredictionFactor {
  final String name;
  final double impact;
  final Color color;

  PredictionFactor(this.name, this.impact, this.color);
}

class HourlyPrediction {
  final String time;
  final int waitTime;

  HourlyPrediction(this.time, this.waitTime);
}
