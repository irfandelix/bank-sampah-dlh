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
    // 1. Ambil nama dari peta (sudah benar pakai .kecamatan)
    const namaKecPeta = feature.properties.kecamatan || ""; 
    
    // 2. Cari di data klasemen
    const dataKec = dataKlasemen.find((k) => {
      // 🕵️‍♂️ CCTV: Kita cek apakah field 'kecamatan' ada di database
      if (!k.kecamatan) {
        console.error("⚠️ PERINGATAN: Field 'kecamatan' tidak ditemukan di objek:", k);
        return false;
      }
      return k.kecamatan.toString().toLowerCase().trim() === namaKecPeta.toLowerCase().trim();
    });

    const skor = dataKec ? dataKec.skor : 0;

    // 🕵️‍♂️ CCTV: Munculkan di Console kalau berhasil match
    if (skor > 0) {
      console.log(`✅ MATCH! Kecamatan ${namaKecPeta} dapat skor ${skor}`);
    }

    return {
      fillColor: skor >= 80 ? "#059669" : 
                 skor >= 50 ? "#10b981" : 
                 skor > 0   ? "#f59e0b" : "#334155", // Warna dasar abu tua
      color: "#1e293b", 
      weight: 1,
      opacity: 1,
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const namaKec = feature.properties.kecamatan || "Tidak Diketahui";
    layer.bindTooltip(namaKec, {
      permanent: true,       
      direction: "center",   
      className: "label-kecamatan", 
    });
    layer.bindPopup(`<b>Kecamatan ${namaKec}</b>`);
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
      `}} />

      <MapContainer 
        center={[-7.4266, 110.9922]} 
        zoom={11} 
        style={{ height: "100%", width: "100%", zIndex: 1 }} // Pastikan z-index rendah (1)
        zoomControl={false}
        preferCanvas={true}
      >
        {/* Menggunakan basemap Dark Mode agar senada dengan Dashboard baru kita */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
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