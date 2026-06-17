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
  // Default sizes
  const [tableForm, setTableForm] = useState({ name: "", shape: "RECTANGLE", capacity: 4, width: 100, height: 80, id: null });

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
  const openTableModal = (table = null) => {
    if (table) {
      setTableForm(table);
    } else {
      setTableForm({ name: "", shape: "RECTANGLE", capacity: 4, width: 100, height: 80, id: null });
    }
    setShowTableModal(true);
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (tableForm.id) {
      // Update
      await fetch("/api/admin/tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tableForm)
      });
    } else {
      // Create
      await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tableForm, roomId: activeRoomId, x: 50, y: 50 })
      });
    }
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
    
    newX = Math.round(newX / 10) * 10;
    newY = Math.round(newY / 10) * 10;

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
    
    const room = rooms.find(r => r.id === activeRoomId);
    const table = room.tables.find(t => t.id === draggingTableId);
    
    await fetch("/api/admin/tables", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: table.id, x: table.x, y: table.y, width: table.width, height: table.height, shape: table.shape, capacity: table.capacity, name: table.name })
    });
    
    setDraggingTableId(null);
  };

  // ---------------------------------
  // Reservation Assignment
  // ---------------------------------
  const handleResDragStart = (e, resId) => {
    e.dataTransfer.setData("resId", resId);
  };

  const handleTableDrop = async (e, tableId) => {
    if (isEditMode) return;
    e.preventDefault();
    const resId = e.dataTransfer.getData("resId");
    if (!resId) return;

    const res = reservations.find(r => r.id === parseInt(resId));
    if (!res) return;

    const currentTableIds = res.tables ? res.tables.map(t => t.id) : [];
    
    if (currentTableIds.includes(tableId)) return; // Already assigned to this table

    const newTableIds = [...currentTableIds, tableId];
    
    // Check capacity
    const room = rooms.find(r => r.id === activeRoomId);
    const table = room.tables.find(t => t.id === tableId);
    const currentAssignedCapacity = res.tables ? res.tables.reduce((acc, t) => acc + t.capacity, 0) : 0;
    const totalNewCapacity = currentAssignedCapacity + table.capacity;

    if (totalNewCapacity < res.guestCount) {
      alert(`⚠️ Yetersiz Kapasite!\n\nBu rezervasyon ${res.guestCount} kişilik ancak atadığınız masaların toplam kapasitesi ${totalNewCapacity} kişi. \n\nLütfen bir masa daha ekleyin (Gruplama yapın).`);
    }

    // Update reservation with multiple tables
    await fetch(`/api/admin/reservations/${resId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableIds: newTableIds })
    });
    fetchReservations();
  };

  const handleTableDragOver = (e) => {
    if (isEditMode) return;
    e.preventDefault();
  };

  const removeReservationFromTable = async (resId, tableId) => {
    const res = reservations.find(r => r.id === parseInt(resId));
    if (!res) return;
    
    const currentTableIds = res.tables.map(t => t.id);
    const newTableIds = currentTableIds.filter(id => id !== tableId);

    await fetch(`/api/admin/reservations/${resId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableIds: newTableIds })
    });
    fetchReservations();
  };

  // Generate colors for linked tables based on reservation ID
  const getReservationColor = (resId) => {
    const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];
    return colors[resId % colors.length];
  };

  // Render logic
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // A reservation is fully assigned if total capacity of its tables >= guestCount
  const isResFullyAssigned = (res) => {
    const assignedCap = res.tables ? res.tables.reduce((acc, t) => acc + t.capacity, 0) : 0;
    return assignedCap >= res.guestCount;
  };

  const pendingReservations = reservations.filter(r => !isResFullyAssigned(r));

  return (
    <div className={styles.container}>
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
              // Find all reservations for this specific table by checking their tables array
              const tableReservations = reservations.filter(r => r.tables && r.tables.some(t => t.id === table.id));
              const isOccupied = tableReservations.length > 0;

              let shapeClass = styles.rectTable;
              if (table.shape === "CIRCLE") shapeClass = styles.circleTable;
              if (table.shape === "BOOTH") shapeClass = styles.boothTable;

              // If occupied, use the first reservation's color for the border
              const borderColor = (isOccupied && !isEditMode) ? getReservationColor(tableReservations[0].id) : "";

              return (
                <div 
                  key={table.id}
                  className={`${styles.table} ${shapeClass} ${isOccupied && !isEditMode ? styles.occupied : ""} ${isEditMode ? styles.draggable : ""}`}
                  style={{ 
                    transform: `translate(${table.x}px, ${table.y}px)`,
                    width: `${table.width}px`,
                    height: `${table.height}px`,
                    borderColor: borderColor ? borderColor : undefined,
                    backgroundColor: borderColor ? `${borderColor}22` : undefined
                  }}
                  onPointerDown={(e) => handlePointerDown(e, table)}
                  onDragOver={handleTableDragOver}
                  onDrop={(e) => handleTableDrop(e, table.id)}
                  onClick={() => isEditMode ? openTableModal(table) : null}
                >
                  <span className={styles.tableName}>{table.name}</span>
                  <span className={styles.tableCap}>{table.capacity} Kişi</span>
                  
                  {isEditMode && (
                    <button className={styles.deleteTableBtn} onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }}>×</button>
                  )}

                  {!isEditMode && isOccupied && (
                    <div className={styles.tableResInfo}>
                      {tableReservations.map(tr => (
                        <div key={tr.id} className={styles.trItem} style={{ background: getReservationColor(tr.id) }}>
                          {tr.name} ({tr.guestCount})
                          <button className={styles.unassignBtn} onClick={(e) => { e.stopPropagation(); removeReservationFromTable(tr.id, table.id); }}>X</button>
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
              <button className={styles.addTableBtn} onClick={() => openTableModal()}>+ Masa Ekle</button>
            </div>
          )}
        </div>

        {/* Right Sidebar (Reservations) */}
        {!isEditMode && (
          <div className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Eksik / Atanmayanlar</h3>
            <p className={styles.sidebarSub}>{new Date(selectedDate).toLocaleDateString("tr-TR")} - Masası Tamamlanmamış Rezervasyonlar</p>
            
            <div className={styles.resList}>
              {pendingReservations.map(res => {
                const assignedCap = res.tables ? res.tables.reduce((acc, t) => acc + t.capacity, 0) : 0;
                
                return (
                  <div 
                    key={res.id} 
                    className={styles.resCard}
                    draggable
                    onDragStart={(e) => handleResDragStart(e, res.id)}
                    style={{ borderLeftColor: getReservationColor(res.id) }}
                  >
                    <div className={styles.resName}>{res.name}</div>
                    <div className={styles.resDetails}>👤 {res.guestCount} Kişi | 📞 {res.phone}</div>
                    
                    {assignedCap > 0 && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#d97706", fontWeight: "bold" }}>
                        Kısmen Atandı ({assignedCap} / {res.guestCount} Kapasite) - MASALARI BİRLEŞTİRİN
                      </div>
                    )}
                    
                    {res.note && <div className={styles.resNote}>"{res.note}"</div>}
                  </div>
                )
              })}
              
              {pendingReservations.length === 0 && (
                <div className={styles.emptyRes}>Tüm rezervasyonlar başarıyla masalara atandı! 🎉</div>
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
            <h2>{tableForm.id ? "Masayı Düzenle" : "Masa Ekle"}</h2>
            <form onSubmit={handleSaveTable}>
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

              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Kapasite</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={tableForm.capacity} 
                    onChange={e => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) })} 
                    required 
                    min="1"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Genişlik (px)</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={tableForm.width} 
                    onChange={e => setTableForm({ ...tableForm, width: parseInt(e.target.value) })} 
                    required 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.label}>Yükseklik (px)</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={tableForm.height} 
                    onChange={e => setTableForm({ ...tableForm, height: parseInt(e.target.value) })} 
                    required 
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={styles.submitBtn}>{tableForm.id ? "Güncelle" : "Ekle"}</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowTableModal(false)}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
