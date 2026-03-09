import '../api_client.dart';
import '../../core/config.dart';
import 'package:dio/dio.dart';

/// Repository pour l'authentification selon API backend Laravel
class AuthRepository {
  final ApiClient _client;
  AuthRepository(this._client);

  static Future<AuthRepository> create() async {
    final api = await ApiClient.create();
    return AuthRepository(api);
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    String? phone,
  }) async {
    final data = <String, dynamic>{
      'email': email,
      'password': password,
    };
    
    if (phone != null) {
      data['phone'] = phone;
    }

    final res = await _client.dio.post(
      AppConfig.login,
      data: data,
    );
    
    return res.data;
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    final data = <String, dynamic>{
      'email': email,
      'password': password,
      'name': name,
    };
    
    if (phone != null) {
      data['phone'] = phone;
    }

    final res = await _client.dio.post(
      AppConfig.register,
      data: data,
    );
    
    return res.data;
  }

  Future<void> logout() async {
    await _client.dio.post(AppConfig.logout);
  }

  Future<Map<String, dynamic>> me() async {
    final res = await _client.dio.get('/me');
    return res.data;
  }

  Future<void> registerDevice({
    required String token,
    String? platform,
  }) async {
    final data = <String, dynamic>{
      'token': token,
      if (platform != null) 'platform': platform,
    };

    await _client.dio.post(AppConfig.deviceRegister, data: data);
  }
}
