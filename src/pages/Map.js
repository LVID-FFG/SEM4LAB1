// Map.js - Интерактивная карта предприятия с отмеченными турникетами
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { useData } from "../App";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const getTypeName = (type) => {
    const types = {
        'turnstile': 'Турникет',
        'gate': 'Ворота',
        'barrier': 'Шлагбаум'
    };
    return types[type] || type || '—';
};

const MapLegend = () => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Легенда</div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
        <div
          style={{
            width: "16px",
            height: "16px",
            backgroundColor: "#4CAF50",
            borderRadius: "50%",
            marginRight: "8px",
          }}
        ></div>
        <span>Открыт</span>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "16px",
            height: "16px",
            backgroundColor: "#F44336",
            borderRadius: "50%",
            marginRight: "8px",
          }}
        ></div>
        <span>Заблокирован</span>
      </div>
    </div>
  );
};

const Map = () => {
  const { turnstiles, updateTurnstile, isAdmin } = useData();
  const navigate = useNavigate();

  const defaultCenter = [55.751244, 37.618423];
  const defaultZoom = 17;

  const [showUnplaced, setShowUnplaced] = useState(false);
  const unplacedTurnstiles = turnstiles.filter(
    (t) => !t.lat || !t.lng || t.lat === undefined || t.lng === undefined
  );
  const placedTurnstiles = turnstiles.filter(
    (t) => t.lat && t.lng && t.lat !== undefined && t.lng !== undefined
  );

  const handleToggleStatus = async (turnstile, e) => {
    e.stopPropagation();
    const newStatus = turnstile.status === "open" ? "blocked" : "open";
    console.log(`[Map] Переключение статуса турникета ${turnstile.id} на ${newStatus}`);

    try {
      await updateTurnstile(turnstile.id, { ...turnstile, status: newStatus });
      console.log(`[Map] Статус турникета ${turnstile.id} изменён на ${newStatus}`);
    } catch (error) {
      console.error(`[Map] Ошибка переключения статуса:`, error);
    }
  };

  return (
    <div className="map-page">
      <h1>Карта предприятия</h1>

      {unplacedTurnstiles.length > 0 && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
            border: "1px solid #ffc107",
          }}
        >
          <strong>Турникеты без координат на карте:</strong>
          <button
            onClick={() => setShowUnplaced(!showUnplaced)}
            style={{ marginLeft: "10px", cursor: "pointer" }}
          >
            {showUnplaced ? "Скрыть" : "Показать"} ({unplacedTurnstiles.length})
          </button>
          {showUnplaced && (
            <ul style={{ margin: "5px 0 0 0" }}>
              {unplacedTurnstiles.map((t) => (
                <li key={t.id}>
                  {t.name} ({t.location})
                  {isAdmin && (
                    <button
                      onClick={() => navigate(`/detail/${t.id}`)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#007bff",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                        marginLeft: "8px"
                      }}
                    >
                      добавить координаты
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: "500px", width: "100%", borderRadius: "8px" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {placedTurnstiles.map((turnstile) => {
            const icon = turnstile.status === "open" ? greenIcon : redIcon;
            
            return (
              <Marker
                key={turnstile.id}
                position={[turnstile.lat, turnstile.lng]}
                icon={icon}
              >
                <Popup>
                  <div style={{ minWidth: "200px" }}>
                    <h3 style={{ margin: "0 0 5px 0" }}>
                      {turnstile.name} ({getTypeName(turnstile.type)})
                    </h3>
                    <p style={{ margin: "0 0 5px 0" }}>
                      <strong>Расположение:</strong> {turnstile.location}
                    </p>
                    <p style={{ margin: "0 0 10px 0" }}>
                      <strong>Статус:</strong>{" "}
                      <span
                        style={{
                          color: turnstile.status === "open" ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {turnstile.status === "open" ? "Открыт" : "Заблокирован"}
                      </span>
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={(e) => handleToggleStatus(turnstile, e)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: turnstile.status === "open" ? "#dc3545" : "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                        }}
                      >
                        {turnstile.status === "open" ? "Заблокировать" : "Открыть"}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => navigate(`/detail/${turnstile.id}`)}
                          style={{
                            padding: "5px 10px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                          }}
                        >
                          Редактировать
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <MapLegend />
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            padding: "15px",
            border: "1px solid #28a745",
            borderRadius: "5px",
            backgroundColor: "#d4edda",
            flex: "1",
            minWidth: "150px",
          }}
        >
          <h3 style={{ margin: "0 0 5px 0" }}>Открыто</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            {turnstiles.filter((t) => t.status === "open").length}
          </p>
        </div>
        <div
          style={{
            padding: "15px",
            border: "1px solid #dc3545",
            borderRadius: "5px",
            backgroundColor: "#f8d7da",
            flex: "1",
            minWidth: "150px",
          }}
        >
          <h3 style={{ margin: "0 0 5px 0" }}>Заблокировано</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            {turnstiles.filter((t) => t.status === "blocked").length}
          </p>
        </div>
        <div
          style={{
            padding: "15px",
            border: "1px solid #6c757d",
            borderRadius: "5px",
            backgroundColor: "#e2e3e5",
            flex: "1",
            minWidth: "150px",
          }}
        >
          <h3 style={{ margin: "0 0 5px 0" }}>Всего</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            {turnstiles.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Map;