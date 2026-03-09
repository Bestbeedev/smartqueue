import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smartqueue_user/data/api_client.dart';
import 'package:smartqueue_user/data/repositories/establishments_repository.dart';
import 'package:smartqueue_user/services/location_service.dart';
import 'package:geolocator/geolocator.dart';

import '../../data/models/establishment.dart';

final locationServiceProvider = Provider((ref) => LocationService());

enum NearbyEstablishmentsStatus {
  ok,
  locationServiceDisabled,
  permissionDenied,
  permissionDeniedForever,
}

class NearbyEstablishmentsResult {
  final NearbyEstablishmentsStatus status;
  final Position? position;
  final List<Establishment> establishments;

  const NearbyEstablishmentsResult({
    required this.status,
    required this.position,
    required this.establishments,
  });
}

final nearbyEstablishmentsProvider = FutureProvider.autoDispose<NearbyEstablishmentsResult>((ref) async {
  final api = await ApiClient.create();
  final repo = EstablishmentsRepository(api);
  final loc = ref.read(locationServiceProvider);

  final enabled = await loc.isLocationServiceEnabled();
  if (!enabled) {
    return const NearbyEstablishmentsResult(
      status: NearbyEstablishmentsStatus.locationServiceDisabled,
      position: null,
      establishments: <Establishment>[],
    );
  }

  final perm = await loc.permission();
  if (perm == LocationPermission.deniedForever) {
    return const NearbyEstablishmentsResult(
      status: NearbyEstablishmentsStatus.permissionDeniedForever,
      position: null,
      establishments: <Establishment>[],
    );
  }

  final pos = await loc.currentPosition();
  if (pos == null) {
    return const NearbyEstablishmentsResult(
      status: NearbyEstablishmentsStatus.permissionDenied,
      position: null,
      establishments: <Establishment>[],
    );
  }

  final list = await repo.nearby(pos.latitude, pos.longitude);
  return NearbyEstablishmentsResult(
    status: NearbyEstablishmentsStatus.ok,
    position: pos,
    establishments: list,
  );
});
