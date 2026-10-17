# Jeff 2.0 Workout Screen Design Principles (Core UX Law)

## กฎเหล็กของหน้าจอเวิร์กเอาต์ (Workout Screen Law)

เมื่อผู้ใช้เปิดหน้า Workout เข้ามา **ต้องรู้ทันทีใน 1 วินาทีแรก**:
1. **กำลังฝึกท่าอะไร** (Current Exercise Name & Identity)
2. **เซตไหน** (Current Set Number e.g. 01, 02)
3. **ใช้น้ำหนักและจำนวนครั้งเท่าไร** (Working Weight, Unit & Reps - พร้อม Stepper −/+ ที่กดง่ายด้วยมือเดียว)
4. **ต้องกดอะไรต่อ** (Next Action ที่ชัดเจน เช่น ปุ่มบันทึกเซต 44×44px, ปุ่มไปท่าถัดไป "Next Exercise →", หรือ "Finish Workout ✓")

## Progressive Disclosure สำหรับข้อมูลประกอบ
ข้อมูลประกอบทุกอย่างยังคงอยู่ครบ 100% แต่ต้อง **ไม่แย่งพื้นที่จากการบันทึกเซต**:
- **Volume & สถิติ PR**: เก็บไว้ในส่วนขยาย (Accordion/Drawer) หรือ Progressive Disclosure
- **Anatomy & กล้ามเนื้อ 3D**: แสดงใน Accordion ของท่า หรือการ์ดภาพรวมบนหน้า Dashboard
- **การตั้งค่าเครื่อง (Tare Weight / Pulley Ratio)**: อยู่ในส่วนขยายการตั้งค่าเครื่อง ไม่วางขวางหน้าตารางเซต
- **คำแนะนำขั้นสูง & RPE**: แสดงแบบกระชับ 1 บรรทัด หรือเก็บในส่วนขยาย
