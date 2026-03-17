import modalStyles from "../../styles/customer/CustomerModals.module.scss";
import baseStyles from "../../styles/customer/Customer.module.scss";

export default function VisualSearchModal({
  open = false,
  visualTab = "search",
  visualPreview = "",
  visualResults = [],
  vchatMessages = [],
  vchatInput = "",
  tchatMessages = [],
  tchatInput = "",
  tryonSelfie = "",
  tryonProductCode = "",
  tryonProducts = [],
  tryonStageProduct = null,
  isGuest = false,
  closeVisualModal,
  switchVisualTab,
  doVisualSearch,
  sendVChat,
  setVchatInput,
  tryOnSelfieUpload,
  tryOnPickFromSelect,
  sendTChat,
  setTchatInput,
  openProductModal,
  addToCart,
}) {
  return (
    <div
      className={`${modalStyles.modalWrap} ${open ? modalStyles.open : ""}`}
      id="visual-modal"
    >
      <div className={modalStyles.modalBox}>
        <button className={modalStyles.modalClose} onClick={closeVisualModal}>
          ✕
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "0.85rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "1.3rem",
              color: "var(--gold)",
            }}
          >
            📷 חיפוש חזותי + נסה עליי
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
              onClick={() => switchVisualTab("search")}
            >
              חיפוש לפי תמונה
            </button>

            <button
              className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
              onClick={() => switchVisualTab("tryon")}
            >
              נסה עליי
            </button>
          </div>
        </div>

        {visualTab === "search" && (
          <div id="vs-tab-search">
            <div className={modalStyles.vsLayout}>
              <div className={modalStyles.card}>
                <div className={baseStyles.secTitle}>📷 תמונה לחיפוש</div>

                <div className={modalStyles.uploadDrop}>
                  <input type="file" accept="image/*" onChange={doVisualSearch} />
                  <div className={modalStyles.uploadIcon}>🖼️</div>
                  <div className={modalStyles.uploadText}>
                    גרור תמונה או <strong>לחץ לבחירה</strong>
                  </div>
                </div>

                {visualPreview && (
                  <div id="vis-preview-wrap" style={{ marginTop: "1rem" }}>
                    <img
                      id="vis-preview-img"
                      src={visualPreview}
                      style={{
                        width: "100%",
                        borderRadius: "14px",
                        maxHeight: "260px",
                        objectFit: "cover",
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className={modalStyles.card} id="vis-results-card">
                <div className={baseStyles.secTitle}>תוצאות</div>

                {visualResults.length ? (
                  visualResults.map((product) => (
                    <div
                      key={product.code}
                      style={{
                        display: "flex",
                        gap: ".9rem",
                        alignItems: "center",
                        padding: ".75rem",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        borderRadius: "10px",
                      }}
                      onClick={() => openProductModal(product.code)}
                    >
                      <img
                        src={product.img}
                        style={{
                          width: "58px",
                          height: "58px",
                          objectFit: "cover",
                          borderRadius: "11px",
                          border: "1px solid var(--border)",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: ".92rem" }}>
                          {product.name}
                        </div>
                        <div
                          style={{
                            color: product.sale ? "#a855f7" : "var(--gold)",
                            fontWeight: 900,
                          }}
                        >
                          ₪{product.price}
                        </div>
                      </div>

                      {!isGuest && (
                        <button
                          className={`${baseStyles.btn} ${baseStyles.btnGold}`}
                          style={{ minWidth: "90px", flex: "0 0 auto" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product.code);
                          }}
                        >
                          🛒
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2.5rem",
                      color: "var(--light-gray)",
                    }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: "0.9rem" }}>🔍</div>
                    העלה תמונה לתוצאות
                  </div>
                )}
              </div>

              <div className={modalStyles.card} style={{ gridColumn: "1/-1" }}>
                <div className={baseStyles.secTitle}>💬 צ'אט בזמן החיפוש</div>

                <div className={modalStyles.miniChat}>
                  <div className={modalStyles.miniChatTop}>
                    <div className="title">SYNC</div>
                    <div style={{ fontSize: "0.76rem", color: "var(--green)" }}>
                      ● מחובר
                    </div>
                  </div>

                  <div className={modalStyles.miniChatBody} id="vchat-body">
                    {vchatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`msg ${msg.type === "user" ? "user" : "bot"}`}
                        style={{ maxWidth: "100%" }}
                        dangerouslySetInnerHTML={{ __html: msg.html }}
                      />
                    ))}
                  </div>

                  <div className={modalStyles.miniChatBottom}>
                    <button className={modalStyles.miniSend} onClick={sendVChat}>
                      ➤
                    </button>
                    <textarea
                      className={modalStyles.miniIn}
                      id="vchat-in"
                      placeholder="כתוב הודעה..."
                      rows="1"
                      value={vchatInput}
                      onChange={(e) => setVchatInput(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendVChat();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {visualTab === "tryon" && (
          <div id="vs-tab-tryon">
            <div className={modalStyles.vsLayout}>
              <div className={modalStyles.card}>
                <div className={baseStyles.secTitle}>🤳 תמונה שלך</div>

                <div className={modalStyles.uploadDrop}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={tryOnSelfieUpload}
                  />
                  <div className={modalStyles.uploadIcon}>📸</div>
                  <div className={modalStyles.uploadText}>העלה תמונה שלך</div>
                </div>

                {tryonSelfie && (
                  <div id="tryon-selfie-wrap" style={{ marginTop: "1rem" }}>
                    <img
                      id="tryon-selfie-img"
                      src={tryonSelfie}
                      style={{
                        width: "100%",
                        borderRadius: "14px",
                        maxHeight: "240px",
                        objectFit: "cover",
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                )}

                <div style={{ marginTop: "1rem" }}>
                  <div className={baseStyles.secTitle}>בחר פריט</div>

                  <select
                    id="tryonProductSelect"
                    value={tryonProductCode}
                    onChange={(e) => tryOnPickFromSelect(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "0.72rem",
                      color: "#111",
                      fontFamily: '"Alef", sans-serif',
                      outline: "none",
                    }}
                  >
                    <option value="">בחר/י פריט…</option>
                    {tryonProducts.map((product) => (
                      <option key={product.code} value={product.code}>
                        {product.gender === "גברים"
                          ? "👔"
                          : product.gender === "נשים"
                          ? "👗"
                          : "👕"}{" "}
                        {product.name}
                        {product.sale ? " 🏷️" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={modalStyles.card}>
                <div className={baseStyles.secTitle}>🪞 תצוגה</div>

                <div
                  id="tryon-stage-wrap"
                  style={{
                    color: "var(--light-gray)",
                    textAlign: "center",
                    padding: "1.2rem",
                  }}
                >
                  {tryonSelfie && tryonStageProduct ? (
                    <div className={modalStyles.tryonStage}>
                      <img src={tryonSelfie} alt="selfie" />
                      <img
                        className={modalStyles.tryonOverlay}
                        src={tryonStageProduct.img}
                        alt={tryonStageProduct.name}
                      />

                      <div className={modalStyles.tryonCap}>
                        <div className="small">דמו</div>
                        <div className="big">
                          {tryonStageProduct.name} · ₪{tryonStageProduct.price}
                        </div>

                        <div
                          style={{
                            marginTop: ".65rem",
                            display: "flex",
                            gap: ".6rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className={`${baseStyles.btn} ${baseStyles.btnGold}`}
                            onClick={() => openProductModal(tryonStageProduct.code)}
                          >
                            🛍️ פתח
                          </button>

                          {!isGuest && (
                            <button
                              className={`${baseStyles.btn} ${baseStyles.btnOutline}`}
                              onClick={() => addToCart(tryonStageProduct.code)}
                            >
                              🛒 הוסף לסל
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    "העלה תמונה ובחר פריט"
                  )}
                </div>
              </div>

              <div className={modalStyles.card} style={{ gridColumn: "1/-1" }}>
                <div className={baseStyles.secTitle}>💬 צ'אט נסה עליי</div>

                <div className={modalStyles.miniChat}>
                  <div className={modalStyles.miniChatTop}>
                    <div className="title">SYNC – עוזר מדידה</div>
                    <div style={{ fontSize: "0.76rem", color: "var(--green)" }}>
                      ● מחובר
                    </div>
                  </div>

                  <div className={modalStyles.miniChatBody} id="tchat-body">
                    {tchatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`msg ${msg.type === "user" ? "user" : "bot"}`}
                        style={{ maxWidth: "100%" }}
                        dangerouslySetInnerHTML={{ __html: msg.html }}
                      />
                    ))}
                  </div>

                  <div className={modalStyles.miniChatBottom}>
                    <button className={modalStyles.miniSend} onClick={sendTChat}>
                      ➤
                    </button>

                    <textarea
                      className={modalStyles.miniIn}
                      id="tchat-in"
                      placeholder="כתוב הודעה..."
                      rows="1"
                      value={tchatInput}
                      onChange={(e) => setTchatInput(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendTChat();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}