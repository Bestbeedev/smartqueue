import 'package:geolocator/geolocator.dart';

/// Service géolocalisation: permissions + position courante
class LocationService {
  Future<bool> isLocationServiceEnabled() => Geolocator.isLocationServiceEnabled();

  Future<bool> ensurePermission() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) return false;
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    return perm == LocationPermission.always || perm == LocationPermission.whileInUse;
  }

  Future<LocationPermission> permission() => Geolocator.checkPermission();

  Future<Position?> currentPosition() async {
    if (!await ensurePermission()) return null;
    return Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
  }
}
