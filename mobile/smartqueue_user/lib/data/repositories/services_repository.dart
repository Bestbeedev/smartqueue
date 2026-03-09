import '../api_client.dart';
import '../models/service.dart';
import '../../core/config.dart';

class ServicesRepository {
  final ApiClient _client;
  ServicesRepository(this._client);

  Future<List<ServiceModel>> byEstablishment(
    int estId, {
    String? status,
    bool? prioritySupport,
    int? peopleWaitingMin,
    int? peopleWaitingMax,
    int? perPage,
  }) async {
    final queryParams = <String, dynamic>{
      if (status != null) 'status': status,
      if (prioritySupport != null) 'priority_support': prioritySupport,
      if (peopleWaitingMin != null) 'people_waiting_min': peopleWaitingMin,
      if (peopleWaitingMax != null) 'people_waiting_max': peopleWaitingMax,
      if (perPage != null) 'per_page': perPage,
    };

    final res = await _client.dio.get(
      AppConfig.servicesByEst(estId),
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );

    final data = res.data is Map && res.data['data'] is List
        ? res.data['data']
        : res.data;
    return (data as List).map((e) => ServiceModel.fromJson(e)).toList();
  }

  Future<ServiceModel> detail(int id) async {
    final res = await _client.dio.get(AppConfig.serviceDetail(id));
    final data = res.data is Map && res.data['data'] != null
        ? res.data['data']
        : res.data;
    return ServiceModel.fromJson(data);
  }

  Future<Map<String, dynamic>> affluence(int id) async {
    final res = await _client.dio.get(AppConfig.serviceAffluence(id));
    return res.data;
  }

  Future<Map<String, dynamic>> recommendations(int id) async {
    final res = await _client.dio.get(AppConfig.serviceRecommendations(id));
    return res.data;
  }
}
