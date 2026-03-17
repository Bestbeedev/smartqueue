<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code - {{ $service->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            padding: 20mm;
            text-align: center;
        }
        .header {
            margin-bottom: 15mm;
        }
        .header h1 {
            font-size: 28pt;
            color: #333;
            margin-bottom: 5mm;
        }
        .header h2 {
            font-size: 18pt;
            color: #666;
            font-weight: normal;
        }
        .qr-container {
            margin: 20mm auto;
            padding: 10mm;
            border: 2px solid #333;
            border-radius: 10px;
            display: inline-block;
        }
        .qr-code {
            width: 150mm;
            height: 150mm;
        }
        .info-box {
            margin-top: 15mm;
            padding: 10mm;
            background-color: #f5f5f5;
            border-radius: 5px;
            text-align: left;
        }
        .info-box p {
            font-size: 12pt;
            color: #333;
            margin-bottom: 3mm;
        }
        .info-box .label {
            font-weight: bold;
            color: #666;
        }
        .footer {
            margin-top: 20mm;
            padding-top: 10mm;
            border-top: 1px solid #ccc;
        }
        .footer p {
            font-size: 10pt;
            color: #999;
        }
        .instructions {
            margin-top: 15mm;
            padding: 10mm;
            background-color: #e8f4e8;
            border-radius: 5px;
            text-align: left;
        }
        .instructions h3 {
            font-size: 14pt;
            color: #2d5a2d;
            margin-bottom: 5mm;
        }
        .instructions ul {
            margin-left: 10mm;
        }
        .instructions li {
            font-size: 11pt;
            color: #333;
            margin-bottom: 3mm;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $service->name }}</h1>
        <h2>{{ $service->establishment?->name ?? '' }}</h2>
    </div>
    
    <div class="qr-container">
        <img src="data:image/svg+xml;base64,{{ $qrCodeBase64 }}" alt="QR Code" class="qr-code">
    </div>
    
    <div class="info-box">
        <p><span class="label">Service:</span> {{ $service->name }}</p>
        <p><span class="label">Établissement:</span> {{ $service->establishment?->name ?? '' }}</p>
        <p><span class="label">Code:</span> {{ $qrContent }}</p>
        <p><span class="label">Généré le:</span> {{ $service->qr_generated_at?->format('d/m/Y H:i') ?? '' }}</p>
    </div>
    
    <div class="instructions">
        <h3>Instructions pour les usagers:</h3>
        <ul>
            <li>Scannez ce QR code avec l'application SmartQueue</li>
            <li>Un ticket sera automatiquement créé pour ce service</li>
            <li>Consultez votre position dans la file d'attente en temps réel</li>
            <li>Vous serez notifié lorsque votre tour approche</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>SmartQueue - Système de gestion de files d'attente</p>
        <p>Ce QR code est permanent et peut être utilisé chaque jour</p>
    </div>
</body>
</html>
