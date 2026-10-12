# Creates an original silent MPEG-1 Layer III file without installing an encoder.
# Each 128 kbit/s, 44.1 kHz mono frame has zero side-information and zero
# spectral coefficients. No bit reservoir, ID3 metadata, or external recording.
param([int]$Seconds = 30)
$ErrorActionPreference = 'Stop'
if ($Seconds -lt 1 -or $Seconds -gt 600) { throw 'Use 1 to 600 seconds.' }
$destination = Join-Path $PSScriptRoot '..\assets\silence.mp3'
$frames = [int][Math]::Ceiling($Seconds * 44100 / 1152)
$frame = [byte[]]::new(417)
$frame[0] = 0xFF; $frame[1] = 0xFB; $frame[2] = 0x90; $frame[3] = 0xC0
$file = [IO.File]::Create([IO.Path]::GetFullPath($destination))
try { for ($i = 0; $i -lt $frames; $i++) { $file.Write($frame, 0, $frame.Length) } }
finally { $file.Dispose() }
Write-Output "Created silent MP3: $destination ($frames frames)"
