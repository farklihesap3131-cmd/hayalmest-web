"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./tables.module.css";

export default function TablesPage() {
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [reservations, setReservations] = useState([]);
  
  // Dragging state for tables
  const [draggingTableId, setDraggingTableId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Modal states
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableForm, setTableForm] = useState({ name: "", shape: "RECTANGLE", capacity: 4 });

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      fetchReservations();
    }
  }, [selectedDate, isEditMode]);

  const fetchRooms = async () => {
    const res = await fetch("/api/admin/rooms");
    const data = await res.json();
    setRooms(data);
    if (data.length > 0 && !activeRoomId) {
      setActiveRoomId(data[0].id);
    }
  };

  const fetchReservations = async () => {
    const res = await fetch(`/api/admin/reservations/by-date?date=${selectedDate}`);
    const data = await res.json();
    setReservations(data);
  };

  // ---------------------------------
  // Room Management
  // ---------------------------------
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: roomName })
    });
    setRoomName("");
    setShowRoomModal(false);
    fetchRooms();
  };

  const handleDeleteRoom = async (id) => {
    if (!confirm("Bu odayı ve içindeki tüm masaları silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
    if (activeRoomId === id) setActiveRoomId(null);
    fetchRooms();
  };

  // ---------------------------------
  // Table Management
  // ---------------------------------
  const handleCreateTable = async (e) => {
    e.preventDefault();
    await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tableForm, roomId: activeRoomId, x: 50, y: 50 })
    });
    setTableForm({ name: "", shape: "RECTANGLE", capacity: 4 });
    setShowTableModal(false);
    fetchRooms();
  };

  const handleDeleteTable = async (id) => {
    if (!confirm("Bu masayı silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    fetchRooms();
  };

  // ---------------------------------
  // Drag & Drop (Tables)
  // ---------------------------------
  const handlePointerDown = (e, table) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setDraggingTableId(table.id);
    
    // Calculate offset from top-left of the table to the mouse cursor
    const rect = e.target.getBoundingClientRect();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    
    setDragOffset({
      x: mouseX - table.x,
      y: mouseY - table.y
    });
  };

  const handlePointerMove = (e) => {
    if (!isEditMode || !draggingTableId || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    let newX = e.clientX - canvasRect.left - dragOffset.x;
    let newY = e.clientY - canvasRect.top - dragOffset.y;
    
    // Grid snapping (snap to 10px grid)
    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;

    // Update local state for smooth dragging
    setRooms(prevRooms => prevRooms.map(r => {
      if (r.id !== activeRoomId) return r;
      return {
        ...r,
        tables: r.tables.map(t => t.id === draggingTableId ? { ...t, x: newX, y: newY } : t)
      };
    }));
  };

  const handlePointerUp = async (e) => {
    if (!isEditMode || !draggingTableId) return;
    e.target.releasePointerCapture(e.pointerId);
    
    // Save new position to DB
    const room = rooms.find(r => r.id === activeRoomId);
    const table = room.tables.find(t => t.id === draggingTableId);
    
    await fetch("/api/admin/tables", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: table.id, x: table.x, y: table.y, shape: table.shape, capacity: table.capacity, name: table.name })
    });
    
    setDraggingTableId(null);
  };

  // ---------------------------------
  // Reservation Assignment
  // ---------------------------------
  const [draggedResId, setDraggedResId] = useState(null);

  const handleResDragStart = (e, resId) => {
    setDraggedResId(resId);
    e.dataTransfer.setData("resId", resId);
  };

  const handleTableDrop = async (e, tableId) => {
    if (isEditMode) return;
    e.preventDefault();
    const resId = e.dataTransfer.getData("resId");
    if (!resId) return;

    // Update reservation with new tableId
    await fetch(`/api/admin/reservations/${resId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId })
    });
    fetchReservations(); // Refresh reservations
  };

  const handleTableDragOver = (e) => {
    if (isEditMode) return;
    e.preventDefault();
  };

  const removeReservationFromTable = async (resId) => {
    await fetch(`/api/admin/reservations/${resId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: null })
    });
    fetchReservations();
  };

  // Render logic
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Masa Yönetimi</h1>
        <div className={styles.headerControls}>
          <button 
            className={`${styles.modeBtn} ${isEditMode ? styles.activeMode : ""}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? "Tasarım Modundan Çık" : "Sahne Düzenle"}
          </button>
          
          {!isEditMode && (
            <input 
              type="date" 
              className={styles.datePicker} 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          )}
        </div>
      </div>

      <div className={styles.mainArea}>
        {/* Canvas Area */}
        <div className={styles.canvasWrapper}>
          <div className={styles.roomTabs}>
            {rooms.map(room => (
              <div 
                key={room.id} 
                className={`${styles.tab} ${activeRoomId === room.id ? styles.activeTab : ""}`}
                onClick={() => setActiveRoomId(room.id)}
              >
                {room.name}
                {isEditMode && (
                  <span className={styles.deleteRoom} onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}>×</span>
                )}
              </div>
            ))}
            {isEditMode && (
              <button className={styles.addRoomBtn} onClick={() => setShowRoomModal(true)}>+ Yeni Oda</button>
            )}
          </div>

          <div 
            className={`${styles.canvas} ${isEditMode ? styles.canvasEdit : ""}`}
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {activeRoom && activeRoom.tables.map(table => {
              // Find reservations for this table
              const tableReservations = reservations.filter(r => r.tableId === table.id);
              const isOccupied = tableReservations.length > 0;

              let shapeClass = styles.rectTable;
              if (table.shape === "CIRCLE") shapeClass = styles.circleTable;
              if (table.shape === "BOOTH") shapeClass = styles.boothTable;

              return (
                <div 
                  key={table.id}
                  className={`${styles.table} ${shapeClass} ${isOccupied && !isEditMode ? styles.occupied : ""} ${isEditMode ? styles.draggable : ""}`}
                  style={{ transform: `translate(${table.x}px, ${table.y}px)` }}
                  onPointerDown={(e) => handlePointerDown(e, table)}
                  onDragOver={handleTableDragOver}
                  onDrop={(e) => handleTableDrop(e, table.id)}
                >
                  <span className={styles.tableName}>{table.name}</span>
                  <span className={styles.tableCap}>{table.capacity} Kişi</span>
                  
                  {isEditMode && (
                    <button className={styles.deleteTableBtn} onClick={() => handleDeleteTable(table.id)}>×</button>
                  )}

                  {!isEditMode && isOccupied && (
                    <div className={styles.tableResInfo}>
                      {tableReservations.map(tr => (
                        <div key={tr.id} className={styles.trItem}>
                          {tr.name} ({tr.guestCount})
                          <button className={styles.unassignBtn} onClick={(e) => { e.stopPropagation(); removeReservationFromTable(tr.id); }}>X</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isEditMode && activeRoomId && (
            <div className={styles.canvasControls}>
              <button className={styles.addTableBtn} onClick={() => setShowTableModal(true)}>+ Masa Ekle</button>
            </div>
          )}
        </div>

        {/* Right Sidebar (Reservations) */}
        {!isEditMode && (
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Atanmayı Bekleyenler</h3>
            <p className={styles.sidebarSub}>{new Date(selectedDate).toLocaleDateString("tr-TR")} Tarihli Onaylanmış Rezervasyonlar</p>
            
            <div className={styles.resList}>
              {reservations.filter(r => r.tableId === null).map(res => (
                <div 
                  key={res.id} 
                  className={styles.resCard}
                  draggable
                  onDragStart={(e) => handleResDragStart(e, res.id)}
                >
                  <div className={styles.resName}>{res.name}</div>
                  <div className={styles.resDetails}>👤 {res.guestCount} Kişi | 📞 {res.phone}</div>
                  {res.note && <div className={styles.resNote}>"{res.note}"</div>}
                </div>
              ))}
              
              {reservations.filter(r => r.tableId === null).length === 0 && (
                <div className={styles.emptyRes}>Bu tarihe ait atanacak rezervasyon yok.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRoomModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Yeni Oda / Salon Ekle</h2>
            <form onSubmit={handleCreateRoom}>
              <input 
                className={styles.input} 
                placeholder="Örn: Ana Salon" 
                value={roomName} 
                onChange={e => setRoomName(e.target.value)} 
                required 
              />
              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn}>Oluştur</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowRoomModal(false)}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTableModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Masa / Loca Ekle</h2>
            <form onSubmit={handleCreateTable}>
              <label className={styles.label}>İsim</label>
              <input 
                className={styles.input} 
                placeholder="Örn: Masa 1" 
                value={tableForm.name} 
                onChange={e => setTableForm({ ...tableForm, name: e.target.value })} 
                required 
              />
              
              <label className={styles.label}>Şekil</label>
              <select 
                className={styles.input} 
                value={tableForm.shape} 
                onChange={e => setTableForm({ ...tableForm, shape: e.target.value })}
              >
                <option value="RECTANGLE">Kare / Dikdörtgen</option>
                <option value="CIRCLE">Yuvarlak</option>
                <option value="BOOTH">Loca</option>
              </select>

              <label className={styles.label}>Kapasite</label>
              <input 
                type="number" 
                className={styles.input} 
                value={tableForm.capacity} 
                onChange={e => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) })} 
                required 
                min="1"
              />

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn}>Ekle</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowTableModal(false)}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
