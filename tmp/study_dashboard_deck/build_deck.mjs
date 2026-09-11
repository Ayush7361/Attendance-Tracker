import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const root = "/Users/ayushranjan/study dashboard";
const tmp = `${root}/tmp/study_dashboard_deck`;
const finalPath = `${root}/output/pptx/study-dashboard-build-with-bharat.pptx`;

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const bg = (n) => `${root}/tmp/template-review/template-${n}.png`;
const backgrounds = await Promise.all(Array.from({ length: 9 }, (_, i) => fs.readFile(bg(i + 1))));

function addBackground(slide, sourceNo) {
  slide.images.add({ blob: backgrounds[sourceNo - 1], contentType: "image/png", alt: `Build with Bharat template slide ${sourceNo}`, fit: "cover", position: { left: 0, top: 0, width: 1280, height: 720 } });
}

function addText(slide, text, left, top, width, height, size = 24, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: options.fill || "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontSize: size,
    fontFace: "Arial",
    color: options.color || "#111111",
    bold: options.bold ?? false,
    alignment: options.alignment || "left",
    breakLine: false,
    ...options.style,
  };
  return shape;
}

function addBullets(slide, items, left, top, width, fontSize = 22, lineHeight = 38) {
  items.forEach((item, i) => addText(slide, `• ${item}`, left, top + i * lineHeight, width, lineHeight + 8, fontSize));
}

const notes = "[Sources]\nStudy Dashboard local project source: /Users/ayushranjan/study dashboard\nLive demo: https://attendance-tracker-pi-blue.vercel.app\nGitHub: https://github.com/Ayush7361/Attendance-Tracker";

// 1. Cover
{
  const s = deck.slides.add(); addBackground(s, 1);
  addText(s, "[Your Team Name]", 300, 500, 320, 28, 15, { bold: true });
  addText(s, "Study Dashboard - a unified academic planning & performance companion", 550, 541, 620, 30, 13, { bold: true });
  addText(s, "[Add member names]", 355, 582, 370, 27, 15, { bold: true });
  addText(s, "[Add college name]", 255, 622, 330, 27, 15, { bold: true });
  s.speakerNotes.textFrame.setText(notes);
}

// 2. Problem statement
{
  const s = deck.slides.add(); addBackground(s, 2);
  addText(s, "Students manage attendance, deadlines, study time, routines and grades in separate tools - so priorities get missed.", 94, 245, 1080, 68, 30, { bold: true });
  addBullets(s, [
    "Attendance data is often updated late, making shortages hard to spot.",
    "Deadlines, academic events and study sessions lack one connected view.",
    "Students need actionable insight, not another static timetable or checklist.",
  ], 112, 350, 990, 22, 58);
  addText(s, "Opportunity: turn scattered academic activity into one clear daily plan.", 112, 552, 940, 30, 22, { bold: true, color: "#F4511E" });
  s.speakerNotes.textFrame.setText(notes);
}

// 3. Solution
{
  const s = deck.slides.add(); addBackground(s, 3);
  addText(s, "Study Dashboard is a personal academic operating system that brings daily decisions into one place.", 94, 230, 1040, 64, 30, { bold: true });
  addBullets(s, [
    "Track daily attendance against a recurring weekly class schedule.",
    "Organize deadlines, subtasks, workload forecasts and semester events.",
    "Focus with a study timer, session history, GPA planning and health score.",
  ], 112, 345, 990, 22, 60);
  addText(s, "One dashboard. A clearer next step every day.", 112, 550, 840, 32, 24, { bold: true, color: "#F4511E" });
  s.speakerNotes.textFrame.setText(notes);
}

// 4. Flow
{
  const s = deck.slides.add(); addBackground(s, 4);
  addText(s, "Plan", 105, 332, 160, 38, 27, { bold: true, color: "#F4511E", alignment: "center" });
  addText(s, "Schedule classes\nAdd deadlines & events", 72, 380, 225, 70, 19, { alignment: "center" });
  addText(s, "Track", 380, 332, 160, 38, 27, { bold: true, color: "#F4511E", alignment: "center" });
  addText(s, "Log attendance\nRun study sessions", 346, 380, 225, 70, 19, { alignment: "center" });
  addText(s, "Analyze", 660, 332, 170, 38, 27, { bold: true, color: "#F4511E", alignment: "center" });
  addText(s, "Forecast workload\nReview GPA & health", 630, 380, 230, 70, 19, { alignment: "center" });
  addText(s, "Act", 960, 332, 150, 38, 27, { bold: true, color: "#F4511E", alignment: "center" });
  addText(s, "Prioritize today\nStay ahead of risks", 918, 380, 235, 70, 19, { alignment: "center" });
  addText(s, "→", 298, 350, 45, 35, 30, { bold: true, color: "#147A38", alignment: "center" });
  addText(s, "→", 580, 350, 45, 35, 30, { bold: true, color: "#147A38", alignment: "center" });
  addText(s, "→", 870, 350, 45, 35, 30, { bold: true, color: "#147A38", alignment: "center" });
  addText(s, "All records are scoped to the signed-in user, keeping academic data private.", 150, 555, 960, 30, 20, { alignment: "center", bold: true });
  s.speakerNotes.textFrame.setText(notes);
}

// 5. Tech
{
  const s = deck.slides.add(); addBackground(s, 5);
  addText(s, "A modular MERN architecture keeps the experience fast, private and deployable.", 94, 230, 1080, 42, 28, { bold: true });
  addText(s, "FRONTEND", 130, 342, 260, 32, 23, { bold: true, color: "#F4511E", alignment: "center" });
  addText(s, "React 19 • Vite\nReact Router • Axios\nResponsive web UI", 100, 388, 320, 100, 20, { alignment: "center" });
  addText(s, "BACKEND", 500, 342, 260, 32, 23, { bold: true, color: "#F4511E", alignment: "center" });
  addText(s, "Node.js • Express\nJWT authentication\nREST API", 470, 388, 320, 100, 20, { alignment: "center" });
  addText(s, "DATA & DEPLOYMENT", 840, 342, 310, 32, 23, { bold: true, color: "#F4511E", alignment: "center" });
  addText(s, "MongoDB Atlas • Mongoose\nVercel frontend\nRender backend", 835, 388, 320, 100, 20, { alignment: "center" });
  s.speakerNotes.textFrame.setText(notes);
}

// 6. USP
{
  const s = deck.slides.add(); addBackground(s, 6);
  addText(s, "Not just a tracker: an integrated system that connects academic signals to action.", 94, 230, 1080, 42, 28, { bold: true });
  addBullets(s, [
    "Unified view: attendance, tasks, routine, study sessions, GPA and semester history.",
    "Actionable guidance: workload forecast, deadline insights and academic health score.",
    "Resilient experience: study sessions fall back to local storage when the API is unavailable.",
    "Student-first privacy: account-based records with protected API routes.",
  ], 120, 335, 1000, 21, 52);
  s.speakerNotes.textFrame.setText(notes);
}

// 7. Feasibility & competitor analysis
{
  const s = deck.slides.add(); addBackground(s, 7);
  addText(s, "Built with widely adopted web technologies and designed for practical student workflows.", 94, 230, 1080, 42, 27, { bold: true });
  addText(s, "FEASIBILITY", 150, 335, 365, 35, 24, { bold: true, color: "#F4511E", alignment: "center" });
  addBullets(s, ["Existing working full-stack app", "Cloud-ready deployment", "Modular APIs enable future features"], 115, 390, 420, 19, 47);
  addText(s, "POSITIONING", 760, 335, 365, 35, 24, { bold: true, color: "#F4511E", alignment: "center" });
  addBullets(s, ["Calendar apps: dates, but limited academic insight", "To-do apps: tasks, but no attendance or GPA link", "Study apps: focus, but not a full academic picture"], 700, 390, 430, 19, 47);
  addText(s, "Our edge: a single student workspace that connects planning, progress and performance.", 160, 565, 960, 29, 20, { bold: true, alignment: "center" });
  s.speakerNotes.textFrame.setText(notes);
}

// 8. References/demo
{
  const s = deck.slides.add(); addBackground(s, 8);
  addText(s, "PROJECT LINKS", 100, 330, 1050, 35, 25, { bold: true, color: "#F4511E" });
  addText(s, "GitHub:  https://github.com/Ayush7361/Attendance-Tracker", 110, 392, 970, 34, 21, { bold: true });
  addText(s, "Live demo:  https://attendance-tracker-pi-blue.vercel.app", 110, 445, 970, 34, 21, { bold: true });
  addText(s, "References: React, Vite, Express, MongoDB/Mongoose, Axios, React Router", 110, 498, 970, 34, 19);
  addText(s, "Thank you", 110, 565, 700, 36, 28, { bold: true, color: "#147A38" });
  s.speakerNotes.textFrame.setText(notes);
}

await fs.mkdir(`${root}/output/pptx`, { recursive: true });
await fs.mkdir(`${tmp}/rendered`, { recursive: true });
for (let i = 0; i < deck.slides.items.length; i++) {
  const slide = deck.slides.items[i];
  await writeBlob(`${tmp}/rendered/slide-${i + 1}.png`, await deck.export({ slide, format: "png", scale: 1 }));
  await fs.writeFile(`${tmp}/rendered/slide-${i + 1}.layout.json`, await (await slide.export({ format: "layout" })).text());
}
await writeBlob(`${tmp}/rendered/montage.webp`, await deck.export({ format: "webp", montage: true, scale: 1 }));
const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(finalPath);
console.log(finalPath);
