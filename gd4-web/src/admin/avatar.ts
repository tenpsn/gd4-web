const AV = ["#1a4fa0", "#c8312a", "#1f7a6c", "#7a4fb0", "#a0621a"];

/** สีพื้นหลังรูปโปรไฟล์ของผู้ใช้แต่ละคน ตามต้นแบบหลังบ้าน */
export const avatarColor = (id: number) => AV[(id - 1) % AV.length];
