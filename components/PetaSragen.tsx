"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

export default function PetaSragen({ dataKlasemen }: { dataKlasemen: any[] }) {
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
    <div className="w-full h-full relative bg-[#1e293b] overflow-hidden rounded-[2rem]">
      {/* CSS untuk Label */}
      <style dangerouslySetInnerHTML={{ __html: `
        .label-kecamatan {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: #cbd5e1 !important; /* Warna teks lebih terang untuk mode gelap */
          font-weight: 900 !important;
          font-size: 9px !important;
          text-transform: uppercase;
          text-shadow: 0px 0px 4px rgba(0,0,0,0.8);
          pointer-events: none;
        }
        /* Memperbaiki agar peta tidak menabrak border kontainer */
        .leaflet-container {
          background: #1e293b !important;
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
        style={{ height: "100%", width: "100%", zIndex: 1 }} // Pastikan z-index rendah (1)
        zoomControl={false}
        preferCanvas={true}
      >
        {/* Menggunakan basemap Dark Mode agar senada dengan Dashboard baru kita */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <GeoJSON 
          // ✅ KUNCI SAKTI: Biar peta update setiap kali ada skor yang berubah
          key={JSON.stringify(dataKlasemen)} 
          data={geoData} 
          style={styleWilayah} 
          onEachFeature={onEachFeature} 
        />
      </MapContainer>
    </div>
  );
}