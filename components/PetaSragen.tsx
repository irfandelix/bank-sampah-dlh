"use client";

import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";

// 🛠️ KUNCI SAKTI: Fix icon bawaan Leaflet biar pin lokasinya muncul di Next.js
const iconBawaan = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// 🛠️ TAMBAHAN: Tambahkan `dataPeserta` di dalam kurung Props
export default function PetaSragen({ dataKlasemen = [], dataPeserta = [] }: { dataKlasemen?: any[], dataPeserta?: any[] }) {
  const [geoData, setGeoData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/data/sragen.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("File sragen.geojson tidak ditemukan!");
        return res.json();
      })
      .then((data) => setGeoData(data))
      .catch((err) => setError(err.message));
    
    return () => setMounted(false);
  }, []);

  const styleWilayah = (feature: any) => {
    const namaKecPeta = feature.properties.kecamatan || ""; 
    
    // 1. Cari index/peringkat di klasemen
    const peringkatIndex = dataKlasemen.findIndex((k) => 
      k.kecamatan && k.kecamatan.toString().toLowerCase().trim() === namaKecPeta.toLowerCase().trim()
    );

    const dataKec = peringkatIndex !== -1 ? dataKlasemen[peringkatIndex] : null;
    const skor = dataKec ? dataKec.skor : 0;

    // 2. Tentukan Warna Berdasarkan Peringkat (Juara 1-3)
    let warnaWilayah = "#334155"; // Warna default (abu tua)

    if (peringkatIndex === 0) {
      warnaWilayah = "#10b981"; // Juara 1: Hijau Emerald Menyala
    } else if (peringkatIndex === 1) {
      warnaWilayah = "#f59e0b"; // Juara 2: Amber/Emas
    } else if (peringkatIndex === 2) {
      warnaWilayah = "#ea580c"; // Juara 3: Orange/Perunggu
    } else if (skor > 0) {
      warnaWilayah = "#475569"; // Peserta lain yang sudah ada nilai
    }

    return {
      fillColor: warnaWilayah,
      color: peringkatIndex < 3 && peringkatIndex !== -1 ? "#fff" : "#1e293b", // Border putih buat Top 3
      weight: peringkatIndex === 0 ? 3 : 1, // Garis tepi lebih tebal buat Juara 1
      opacity: 1,
      fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    // 1. Ambil nama murni tanpa embel-embel
    const namaKecPeta = feature.properties.kecamatan || feature.properties.name || "";
    
    // 2. Cari peringkat
    const peringkatIndex = dataKlasemen.findIndex((k) => 
      k.kecamatan && k.kecamatan.toString().toLowerCase().trim() === namaKecPeta.toLowerCase().trim()
    );

    // 3. Susun Label (Tanpa kata "Kecamatan")
    let labelStatus = namaKecPeta; // Default cuma nama: "SRAGEN", "TANON", dll.

    if (peringkatIndex === 0) labelStatus = `🏆 JUARA 1: ${namaKecPeta}`;
    else if (peringkatIndex === 1) labelStatus = `🥈 JUARA 2: ${namaKecPeta}`;
    else if (peringkatIndex === 2) labelStatus = `🥉 JUARA 3: ${namaKecPeta}`;

    layer.bindTooltip(labelStatus, {
      permanent: true,
      direction: "center",
      className: `label-kecamatan ${peringkatIndex < 3 && peringkatIndex !== -1 ? 'label-juara' : ''}`,
    });

    // Popup juga kita bersihkan biar nggak dobel-dobel
    layer.bindPopup(`<b>${namaKecPeta}</b><br/>Skor: ${peringkatIndex !== -1 ? dataKlasemen[peringkatIndex].skor : 0}`);
  };

  if (!mounted || typeof window === "undefined") return null;
  if (error) return <div className="p-10 text-red-500 font-bold">Error: {error}</div>;
  if (!geoData) return <div className="p-10 text-center font-bold text-slate-400 font-sans uppercase tracking-widest text-[10px]">Sinkronisasi Koordinat...</div>;

  return (
    // Background diubah jadi slate-50 biar senada dengan light mode dashboard
    <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-[2rem]">
      {/* CSS untuk Label */}
      <style dangerouslySetInnerHTML={{ __html: `
        .label-kecamatan {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: #f8fafc !important; /* Warna teks putih terang */
          font-weight: 900 !important;
          font-size: 9px !important;
          text-transform: uppercase;
          text-shadow: 0px 0px 5px rgba(0,0,0,0.9);
          pointer-events: none;
        }
        .leaflet-container {
          background: #f8fafc !important;
          border-radius: 2rem !important;
        }
        .label-juara {
          color: #ffffff !important;
          font-size: 11px !important;
          text-shadow: 0px 0px 8px rgba(0,0,0,1) !important;
          letter-spacing: 0.05em;
        }
      `}} />

      <MapContainer 
        center={[-7.4266, 110.9922]} 
        zoom={11} 
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        zoomControl={false}
        preferCanvas={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* LAYER 1: Poligon Kecamatan Klasemen */}
        <GeoJSON 
          key={JSON.stringify(dataKlasemen)} 
          data={geoData} 
          style={styleWilayah} 
          onEachFeature={onEachFeature} 
        />

        {/* ============================================== */}
        {/* LAYER 2: Marker Titik Koordinat Peserta */}
        {/* ============================================== */}
        {dataPeserta && dataPeserta.length > 0 && dataPeserta.map((peserta, idx) => {
          if (!peserta.koordinat) return null;
          
          const coords = peserta.koordinat.split(",").map((c: string) => parseFloat(c.trim()));
          if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return null;

          return (
            <Marker key={`marker-${idx}`} position={[coords[0], coords[1]]} icon={iconBawaan}>
              <Popup className="rounded-xl">
                <div className="text-center p-1">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Lokasi Bank Sampah</p>
                  <h3 className="font-black text-slate-800 text-sm leading-tight">{peserta.namaBank}</h3>
                  <p className="text-xs text-slate-500 mt-1">{peserta.alamat}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {/* ============================================== */}

      </MapContainer>
    </div>
  );
}