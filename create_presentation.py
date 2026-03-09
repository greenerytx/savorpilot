#!/usr/bin/env python3
"""Create Mental Health Safety Moment presentation with SLB Safe Moment theme."""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)
BLUE = RGBColor(0, 0, 0xCC)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK = RGBColor(0x33, 0x33, 0x33)
GRAY = RGBColor(0x66, 0x66, 0x66)
PANEL_W = Inches(4.5)


def panel(slide):
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, PANEL_W, SLIDE_HEIGHT)
    s.fill.solid(); s.fill.fore_color.rgb = BLUE; s.line.fill.background()
    # Speech bubble
    b = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.4), Inches(0.4), Inches(3.6), Inches(1.3))
    b.fill.background(); b.line.color.rgb = WHITE; b.line.width = Pt(3)
    p = b.text_frame.paragraphs[0]; p.text = "Safe Moment"; p.font.size = Pt(28); p.font.bold = True; p.font.color.rgb = WHITE
    t = slide.shapes.add_shape(MSO_SHAPE.ISOSCELES_TRIANGLE, Inches(1.2), Inches(1.65), Inches(0.5), Inches(0.4))
    t.rotation = 180.0; t.fill.background(); t.line.color.rgb = WHITE; t.line.width = Pt(3)
    # Hazard triangle
    h = slide.shapes.add_shape(MSO_SHAPE.ISOSCELES_TRIANGLE, Inches(0.5), Inches(5.6), Inches(0.9), Inches(0.8))
    h.fill.background(); h.line.color.rgb = WHITE; h.line.width = Pt(2)
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(5.7), Inches(0.9), Inches(0.7))
    p = tb.text_frame.paragraphs[0]; p.text = "!"; p.font.size = Pt(24); p.font.bold = True; p.font.color.rgb = WHITE; p.alignment = PP_ALIGN.CENTER
    # Line
    ln = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(6.55), Inches(3.5), Pt(2))
    ln.fill.solid(); ln.fill.fore_color.rgb = WHITE; ln.line.fill.background()
    # SLB logo text
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(6.7), Inches(2), Inches(0.6))
    p = tb.text_frame.paragraphs[0]; p.text = "slb"; p.font.size = Pt(32); p.font.bold = True; p.font.color.rgb = WHITE


def title(slide, text, y=Inches(0.5)):
    tb = slide.shapes.add_textbox(Inches(5.0), y, Inches(7.8), Inches(0.8))
    p = tb.text_frame.paragraphs[0]; p.text = text; p.font.size = Pt(28); p.font.bold = True; p.font.color.rgb = BLUE


def body(slide, lines, y=Inches(1.4), sz=Pt(15)):
    tb = slide.shapes.add_textbox(Inches(5.0), y, Inches(7.8), Inches(5.5))
    tf = tb.text_frame; tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        s = line.strip()
        if s.startswith('##'):
            p.text = s.lstrip('# '); p.font.size = Pt(18); p.font.bold = True; p.font.color.rgb = DARK; p.space_before = Pt(14)
        elif s == '':
            p.text = ''; p.space_before = Pt(4)
        else:
            p.text = s; p.font.size = sz; p.font.color.rgb = DARK; p.space_before = Pt(4)


def stat_box(slide, x, y, w, h, big, small):
    bx = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    bx.fill.solid(); bx.fill.fore_color.rgb = RGBColor(0xE8, 0xF0, 0xFE); bx.line.color.rgb = BLUE; bx.line.width = Pt(1.5)
    tf = bx.text_frame; tf.word_wrap = True; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.text = big; p.font.size = Pt(30); p.font.bold = True; p.font.color.rgb = BLUE; p.alignment = PP_ALIGN.CENTER
    p2 = tf.add_paragraph(); p2.text = small; p2.font.size = Pt(12); p2.font.color.rgb = DARK; p2.alignment = PP_ALIGN.CENTER


def dual_box(slide, x, y, w, h, heading, color, bg, items):
    bx = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    bx.fill.solid(); bx.fill.fore_color.rgb = bg; bx.line.color.rgb = color; bx.line.width = Pt(1.5)
    tf = bx.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = heading; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = color; p.alignment = PP_ALIGN.CENTER
    for item in items:
        p = tf.add_paragraph(); p.text = f"  {item}"; p.font.size = Pt(13); p.font.color.rgb = DARK; p.space_before = Pt(6)


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_WIDTH; prs.slide_height = SLIDE_HEIGHT
    bl = prs.slide_layouts[6]

    # SLIDE 1 — Title
    s = prs.slides.add_slide(bl); panel(s)
    title(s, "Mental Health in the Workplace", Inches(1.5))
    tb = s.shapes.add_textbox(Inches(5.0), Inches(2.5), Inches(7.8), Inches(1.0))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = "Your mind is your most important piece of PPE."; p.font.size = Pt(22); p.font.italic = True; p.font.color.rgb = GRAY
    p2 = tf.add_paragraph(); p2.text = "A Safety Moment on Recognizing, Responding & Supporting"; p2.font.size = Pt(18); p2.font.color.rgb = DARK; p2.space_before = Pt(16)
    stat_box(s, Inches(5.0), Inches(4.2), Inches(2.3), Inches(1.8), "1 in 5", "adults experience\nmental illness each year")
    stat_box(s, Inches(7.6), Inches(4.2), Inches(2.3), Inches(1.8), "55%", "of workers say their job\naffects mental health")
    stat_box(s, Inches(10.2), Inches(4.2), Inches(2.3), Inches(1.8), "$1 Trillion", "lost globally per year\nto anxiety & depression")

    # SLIDE 2 — Why It Matters
    s = prs.slides.add_slide(bl); panel(s)
    title(s, "Why Mental Health Is a Safety Issue")
    body(s, [
        "## The Brain-Body Connection",
        "- Fatigue, distraction & emotional distress impair judgment like alcohol",
        "- Workers with untreated depression have 2x higher injury rates",
        "- Stress hormones reduce reaction time and narrow awareness",
        "",
        "## The Hidden Hazard in Our Industry",
        "- Isolation, long rotations, time away from family, high-pressure ops",
        "- Struggling workers are less likely to speak up about physical hazards",
        "- Suicide rates in construction & extraction: 3-5x the national average",
        "",
        "## It's Not \"Soft\" \u2014 It's Survival",
        "- We wouldn't ignore a frayed wire or a cracked harness",
        "- A struggling mind is an invisible but equally dangerous hazard",
        "- Mental fitness IS operational fitness",
    ])

    # SLIDE 3 — Warning Signs
    s = prs.slides.add_slide(bl); panel(s)
    title(s, "Recognizing the Warning Signs")
    dual_box(s, Inches(5.0), Inches(1.5), Inches(3.7), Inches(5.2),
        "IN YOURSELF", RGBColor(0xCC,0x33,0x33), RGBColor(0xFD,0xF0,0xF0), [
        "Persistent dread about going to work",
        "Snapping at coworkers over small things",
        "Difficulty concentrating or making decisions",
        "Using substances to 'unwind' daily",
        "Headaches, chest tightness, stomach issues",
        "Feeling numb or 'going through the motions'",
        "Sleep problems \u2014 too much or too little",
        "Withdrawing from people you usually enjoy",
    ])
    dual_box(s, Inches(9.1), Inches(1.5), Inches(3.7), Inches(5.2),
        "IN A COWORKER", RGBColor(0x2E,0x7D,0x32), RGBColor(0xE8,0xF5,0xE9), [
        "Sudden change in personality or mood",
        "Increased absences or always late",
        "Uncharacteristic mistakes or near-misses",
        "Pulling away from team conversations",
        "Comments like 'what's the point'",
        "Visible exhaustion beyond normal fatigue",
        "Talking about feeling trapped or hopeless",
        "Giving away personal items (critical red flag)",
    ])

    # SLIDE 4 — R.E.A.C.H. Method
    s = prs.slides.add_slide(bl); panel(s)
    title(s, "How to Respond: The R.E.A.C.H. Method")
    steps = [
        ("R", "Recognize", "Notice behavioral changes \u2014 trust your gut if something feels off."),
        ("E", "Engage", "Pull them aside privately. \"Hey, I've noticed you seem off lately. How are you really doing?\""),
        ("A", "Ask Directly", "\"Are you thinking about hurting yourself?\" Asking does NOT plant the idea. It opens the door."),
        ("C", "Connect", "Help them access EAP, counseling, a trusted leader. Walk with them \u2014 don't just hand them a number."),
        ("H", "Hold Space", "Follow up in a few days. Recovery isn't one conversation \u2014 consistency shows you mean it."),
    ]
    for i, (letter, word, desc) in enumerate(steps):
        yp = Inches(1.6 + i * 1.1)
        c = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(5.0), yp, Inches(0.7), Inches(0.7))
        c.fill.solid(); c.fill.fore_color.rgb = BLUE; c.line.fill.background()
        c.text_frame.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = c.text_frame.paragraphs[0]; p.text = letter; p.font.size = Pt(24); p.font.bold = True; p.font.color.rgb = WHITE; p.alignment = PP_ALIGN.CENTER
        tb = s.shapes.add_textbox(Inches(5.9), yp, Inches(7.0), Inches(0.9))
        tb.text_frame.word_wrap = True
        p = tb.text_frame.paragraphs[0]; p.text = word; p.font.size = Pt(18); p.font.bold = True; p.font.color.rgb = DARK
        p2 = tb.text_frame.add_paragraph(); p2.text = desc; p2.font.size = Pt(14); p2.font.color.rgb = GRAY; p2.space_before = Pt(2)

    # SLIDE 5 — Myths vs Reality
    s = prs.slides.add_slide(bl); panel(s)
    title(s, "Breaking the Stigma: Myths vs. Reality")
    myths = [
        ("\"Tough people don't need help.\"", "The toughest thing you can do is ask for help. SEALs, astronauts, and elite athletes all use mental health support."),
        ("\"It's personal, not a work issue.\"", "When mental health suffers, safety drops. We spend more waking hours at work than anywhere else."),
        ("\"Talking about it makes it worse.\"", "Research shows the opposite. Open conversation reduces distress and can be life-saving."),
        ("\"I'll get fired if I speak up.\"", "EAP services are confidential. Leaders who create safe cultures see higher retention and fewer incidents."),
    ]
    for i, (myth, reality) in enumerate(myths):
        yp = Inches(1.5 + i * 1.45)
        tb = s.shapes.add_textbox(Inches(5.0), yp, Inches(7.8), Inches(0.4))
        tb.text_frame.word_wrap = True
        p = tb.text_frame.paragraphs[0]; p.text = f"MYTH: {myth}"; p.font.size = Pt(15); p.font.bold = True; p.font.color.rgb = RGBColor(0xCC,0x33,0x33)
        tb2 = s.shapes.add_textbox(Inches(5.0), yp + Inches(0.4), Inches(7.8), Inches(0.8))
        tb2.text_frame.word_wrap = True
        p2 = tb2.text_frame.paragraphs[0]; p2.text = f"REALITY: {reality}"; p2.font.size = Pt(14); p2.font.color.rgb = DARK

    # SLIDE 6 — What You Can Do
    s = prs.slides.add_slide(bl); panel(s)
    title(s, "What You Can Do Today")
    body(s, [
        "## As an Individual",
        "- Check in with yourself \u2014 rate your mental energy 1-10 today",
        "- If you're below a 5, tell someone: supervisor, peer, friend",
        "- Use your EAP \u2014 free, confidential, available 24/7",
        "- Set one boundary this week (no emails after 7pm, real lunch break)",
        "",
        "## As a Team Member",
        "- Make \"How are you doing?\" a real question, not a greeting",
        "- Normalize saying \"I'm having a rough day\"",
        "- Look out for the quiet ones \u2014 they may need help most",
        "- Buddy-check systems work for mental health just like physical safety",
        "",
        "## As a Leader",
        "- Start your next pre-job meeting with a mental health check-in",
        "- Share your own struggles \u2014 vulnerability from leaders is powerful",
        "- Know your EAP contact \u2014 save it in your phone right now",
        "- Make it clear: asking for help is strength, not weakness",
    ], sz=Pt(14))

    # SLIDE 7 — Resources
    s = prs.slides.add_slide(bl); panel(s)
    title(s, "Resources & Crisis Support")
    # Crisis box
    bx = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.0), Inches(1.5), Inches(7.8), Inches(1.6))
    bx.fill.solid(); bx.fill.fore_color.rgb = RGBColor(0xFD,0xE8,0xE8); bx.line.color.rgb = RGBColor(0xCC,0,0); bx.line.width = Pt(2)
    tf = bx.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = "IN A CRISIS \u2014 ACT NOW"; p.font.size = Pt(20); p.font.bold = True; p.font.color.rgb = RGBColor(0xCC,0,0); p.alignment = PP_ALIGN.CENTER
    for line in ["988 Suicide & Crisis Lifeline \u2014 Call or text 988 (24/7)", "Crisis Text Line \u2014 Text HOME to 741741", "Emergency Services \u2014 Call 911"]:
        p = tf.add_paragraph(); p.text = line; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = DARK; p.alignment = PP_ALIGN.CENTER; p.space_before = Pt(6)
    body(s, [
        "## Ongoing Support",
        "- Employee Assistance Program (EAP) \u2014 check with HR / benefits",
        "- SAMHSA Helpline \u2014 1-800-662-4357 (free, confidential, 24/7)",
        "- NAMI \u2014 nami.org",
        "",
        "## Self-Care Tools",
        "- Apps: Calm, Headspace, Woebot, PTSD Coach",
        "- Journaling: 5 minutes of writing measurably reduces stress",
        "- Movement: 20 min walking cuts anxiety symptoms by 30%",
        "",
        "## Remember",
        "- You don't need to be \"in crisis\" to use these resources",
        "- Reaching out early is the smartest safety decision you can make",
        "- You are not a burden \u2014 you are a valued team member",
    ], y=Inches(3.3), sz=Pt(14))

    # SLIDE 8 — Closing
    s = prs.slides.add_slide(bl); panel(s)
    tb = s.shapes.add_textbox(Inches(5.0), Inches(1.5), Inches(7.8), Inches(2.0))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = "\"Safety isn't just about\ngoing home in one piece."; p.font.size = Pt(30); p.font.bold = True; p.font.color.rgb = BLUE; p.alignment = PP_ALIGN.CENTER
    p2 = tf.add_paragraph(); p2.text = "It's about going home whole.\""; p2.font.size = Pt(30); p2.font.bold = True; p2.font.color.rgb = BLUE; p2.alignment = PP_ALIGN.CENTER; p2.space_before = Pt(8)
    tb2 = s.shapes.add_textbox(Inches(5.0), Inches(4.0), Inches(7.8), Inches(2.5))
    tf2 = tb2.text_frame; tf2.word_wrap = True
    p = tf2.paragraphs[0]; p.text = "DISCUSSION QUESTIONS"; p.font.size = Pt(18); p.font.bold = True; p.font.color.rgb = DARK
    for q in ["What's one thing that recharges you outside of work?", "Have you ever noticed a coworker struggling? What did you do?", "What would make it easier for YOU to ask for help on this team?"]:
        p = tf2.add_paragraph(); p.text = f"  {q}"; p.font.size = Pt(16); p.font.color.rgb = GRAY; p.space_before = Pt(12)

    prs.save('/home/user/savorpilot/Mental_Health_Safety_Moment.pptx')
    print("Done! 8 slides created.")

if __name__ == '__main__':
    main()
