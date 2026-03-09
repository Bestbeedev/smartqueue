import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppThemeMode { light, dark }

class ThemeManager {
  static final ThemeManager _instance = ThemeManager._internal();
  factory ThemeManager() => _instance;
  ThemeManager._internal();

  late SharedPreferences _prefs;

  AppThemeMode get currentTheme => _prefs.getBool('is_dark_mode') ?? false
      ? AppThemeMode.dark
      : AppThemeMode.light;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  Future<void> toggleTheme() async {
    final isDark = _prefs.getBool('is_dark_mode') ?? false;
    await _prefs.setBool('is_dark_mode', !isDark);
  }

  Future<void> setTheme(AppThemeMode mode) async {
    await _prefs.setBool('is_dark_mode', mode == AppThemeMode.dark);
  }
}

final themeManagerProvider = Provider<ThemeManager>(
  (ref) => ThemeManager()..init(),
);
