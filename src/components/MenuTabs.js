"use client";

import { useState } from "react";
import styles from "../app/home.module.css";

export function MenuTabs({ categories }) {
  const [activeTab, setActiveTab] = useState(categories[0]?.id || null);

  if (!categories || categories.length === 0) {
    return <p className={styles.emptyText}>Menü yakında eklenecektir.</p>;
  }

  const activeCategory = categories.find((c) => c.id === activeTab);

  return (
    <div className={styles.menuContainer}>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === category.id ? '#D4AF37' : 'transparent',
              color: activeTab === category.id ? '#000' : '#D4AF37',
              border: '1px solid #D4AF37',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.1rem',
              transition: 'all 0.3s ease'
            }}
          >
            {category.name}
          </button>
        ))}
      </div>

      {activeCategory && (
        <div className={styles.menuCategory}>
          <ul className={styles.menuList}>
            {activeCategory.items.map((item) => (
              <li key={item.id} className={styles.menuItem}>
                {item.imageUrl && (
                  <div className={styles.menuItemImageContainer}>
                    <img src={item.imageUrl} alt={item.name} className={styles.menuItemImage} />
                  </div>
                )}
                <div className={styles.menuItemContent}>
                  <div className={styles.menuItemHeader}>
                    <span className={styles.menuItemName}>{item.name}</span>
                    <span className={styles.menuItemDots}></span>
                    <span className={styles.menuItemPrice}>₺{item.price}</span>
                  </div>
                  {item.description && (
                    <p className={styles.menuItemDesc}>{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
