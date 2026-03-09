#!/usr/bin/env python3
"""Create Mental Health Safety Moment presentation with SLB Safe Moment theme."""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import math

# Constants
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)
BLUE = RGBColor(0, 0, 0xCC)  # SLB blue
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK_GRAY = RGBColor(0x33, 0x33, 0x33)
LIGHT_GRAY = RGBColor(0x66, 0x66, 0x66)
ACCENT_BLUE = RGBColor(0x00, 0x66, 0xCC)
PANEL_WIDTH = Inches(4.5)


def add_blue_panel(slide):
    """Add the blue left panel."""
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, PANEL_WIDTH, SLIDE_HEIGHT
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = BLUE
    shape.line.fill.background()


def add_speech_bubble(slide, text):
    """Add the speech bubble title in the top-left."""
    # Main bubble rectangle with rounded corners
    bubble = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(0.4), Inches(0.4),
        Inches(3.6), Inches(1.3)
    )
    bubble.fill.background()
    bubble.line.color.rgb = WHITE
    bubble.line.width = Pt(3)

    tf = bubble.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.LEFT

    # Triangle pointer
    tri = slide.shapes.add_shape(
        MSO_SHAPE.ISOSCELES_TRIANGLE,
        Inches(1.2), Inches(1.65),
        Inches(0.5), Inches(0.4)
    )
    tri.rotation = 180.0
    tri.fill.background()
    tri.line.color.rgb = WHITE
    tri.line.width = Pt(3)


def add_hazard_icon(slide):
    """Add warning triangle icon."""
    tri = slide.shapes.add_shape(
        MSO_SHAPE.ISOSCELES_TRIANGLE,
        Inches(0.5), Inches(5.6),
        Inches(0.9), Inches(0.8)
    )
    tri.fill.background()
    tri.line.color.rgb = WHITE
    tri.line.width = Pt(2)

    # Exclamation mark inside
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(5.7), Inches(0.9), Inches(0.7))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "!"
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER


def add_separator_line(slide):
    """Add horizontal separator line."""
    line = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.5), Inches(6.55),
        Inches(3.5), Pt(2)
    )
    line.fill.solid()
    line.fill.fore_color.rgb = WHITE
    line.line.fill.background()


def add_slb_logo(slide):
    """Add SLB text logo."""
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(6.7), Inches(2), Inches(0.6))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "slb"
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = WHITE


def add_panel_elements(slide, title_text):
    """Add all left-panel elements."""
    add_blue_panel(slide)
    add_speech_bubble(slide, title_text)
    add_hazard_icon(slide)
    add_separator_line(slide)
    add_slb_logo(slide)


def add_content_title(slide, title, y=Inches(0.5)):
    """Add a title on the right content area."""
    tb = slide.shapes.add_textbox(Inches(5.0), y, Inches(7.8), Inches(0.8))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(28)
    p.font.bold = True
    p.font.color.rgb = BLUE
    p.alignment = PP_ALIGN.LEFT


def add_content_body(slide, text, y=Inches(1.5), height=Inches(5.5), font_size=Pt(16)):
    """Add body text on the right content area."""
    tb = slide.shapes.add_textbox(Inches(5.0), y, Inches(7.8), height)
    tf = tb.text_frame
    tf.word_wrap = True

    lines = text.strip().split('\n')
    for i, line in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()

        stripped = line.strip()
        if stripped.startswith('**') and stripped.endswith('**'):
            # Bold header line
            p.text = stripped.strip('*')
            p.font.size = Pt(18)
            p.font.bold = True
            p.font.color.rgb = DARK_GRAY
            p.space_before = Pt(12)
        elif stripped.startswith('- '):
            p.text = stripped
            p.font.size = font_size
            p.font.color.rgb = DARK_GRAY
            p.space_before = Pt(4)
            p.level = 1
        elif stripped.startswith(('1.', '2.', '3.', '4.', '5.')):
            p.text = stripped
            p.font.size = font_size
            p.font.color.rgb = DARK_GRAY
            p.space_before = Pt(4)
        elif stripped == '':
            p.text = ''
            p.space_before = Pt(6)
        else:
            p.text = stripped
            p.font.size = font_size
            p.font.color.rgb = DARK_GRAY
            p.space_before = Pt(4)


def add_stat_box(slide, x, y, width, height, stat_text, label_text):
    """Add a statistic highlight box."""
    box = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, x, y, width, height
    )
    box.fill.solid()
    box.fill.fore_color.rgb = RGBColor(0xE8, 0xF0, 0xFE)
    box.line.color.rgb = BLUE
    box.line.width = Pt(1.5)

    tf = box.text_frame
    tf.word_wrap = True
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER

    p = tf.paragraphs[0]
    p.text = stat_text
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = BLUE
    p.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = label_text
    p2.font.size = Pt(12)
    p2.font.color.rgb = DARK_GRAY
    p2.alignment = PP_ALIGN.CENTER


def create_presentation():
    prs = Presentation()
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT
    blank_layout = prs.slide_layouts[6]  # blank

    # ========== SLIDE 1: TITLE ==========
    slide = prs.slides.add_slide(blank_layout)
    add_panel_elements(slide, "Safe Moment")

    add_content_title(slide, "Mental Health in the Workplace", y=Inches(1.5))

    tb = slide.shapes.add_textbox(Inches(5.0), Inches(2.5), Inches(7.8), Inches(1.0))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "Your mind is your most important piece of PPE."
    p.font.size = Pt(22)
    p.font.italic = True
    p.font.color.rgb = LIGHT_GRAY

    p2 = tf.add_paragraph()
    p2.text = "A Safety Moment on Recognizing, Responding & Supporting"
    p2.font.size = Pt(18)
    p2.font.color.rgb = DARK_GRAY
    p2.space_before = Pt(16)

    # Stats boxes
    add_stat_box(slide, Inches(5.0), Inches(4.2), Inches(2.3), Inches(1.8),
                 "1 in 5", "adults experience\nmental illness each year")
    add_stat_box(slide, Inches(7.6), Inches(4.2), Inches(2.3), Inches(1.8),
                 "55%", "of U.S. workers say\njob affects mental health")
    add_stat_box(slide, Inches(10.2), Inches(4.2), Inches(2.3), Inches(1.8),
                 "$1 Trillion", "lost globally per year\nto anxiety & depression")

    # ========== SLIDE 2: WHY IT MATTERS ==========
    slide = prs.slides.add_slide(blank_layout)
    add_panel_elements(slide, "Safe Moment")

    add_content_title(slide, "Why Mental Health Is a Safety Issue")

    content = """
**The Brain-Body Connection**
- Fatigue, distraction, and emotional distress impair judgment the same way alcohol does
- A worker with untreated depression has a 2x higher injury rate on the job
- Stress hormones (cortisol) reduce reaction time and narrow peripheral awareness

**The Hidden Hazard in Our Industry**
- Oil & gas, field services, and remote rotation work carry elevated risk factors:
  isolation, long hours, time away from family, high-pressure environments
- Workers in safety-critical roles who are mentally struggling are less likely
  to speak up about physical hazards — creating a compounding risk
- Suicide rates in construction and extraction industries are 3-5x the national average

**It's Not "Soft" — It's Survival**
- We wouldn't ignore a frayed wire or a cracked harness
- A struggling mind is an invisible but equally dangerous hazard
- Mental fitness IS operational fitness
"""
    add_content_body(slide, content, y=Inches(1.4), font_size=Pt(15))

    # ========== SLIDE 3: WARNING SIGNS ==========
    slide = prs.slides.add_slide(blank_layout)
    add_panel_elements(slide, "Safe Moment")

    add_content_title(slide, "Recognizing the Warning Signs")

    # In yourself box
    box1 = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(5.0), Inches(1.5), Inches(3.7), Inches(5.2)
    )
    box1.fill.solid()
    box1.fill.fore_color.rgb = RGBColor(0xFD, 0xF0, 0xF0)
    box1.line.color.rgb = RGBColor(0xCC, 0x33, 0x33)
    box1.line.width = Pt(1.5)

    tf1 = box1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "IN YOURSELF"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = RGBColor(0xCC, 0x33, 0x33)
    p.alignment = PP_ALIGN.CENTER

    for item in [
        "Persistent dread about going to work",
        "Snapping at coworkers over small things",
        "Difficulty concentrating or making decisions",
        "Using alcohol/substances to 'unwind' daily",
        "Physical symptoms: headaches, chest tightness, stomach issues",
        "Feeling numb, detached, or 'going through the motions'",
        "Sleep problems — too much or too little",
        "Withdrawing from people you usually enjoy",
    ]:
        p = tf1.add_paragraph()
        p.text = f"  {item}"
        p.font.size = Pt(13)
        p.font.color.rgb = DARK_GRAY
        p.space_before = Pt(6)

    # In others box
    box2 = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(9.1), Inches(1.5), Inches(3.7), Inches(5.2)
    )
    box2.fill.solid()
    box2.fill.fore_color.rgb = RGBColor(0xE8, 0xF5, 0xE9)
    box2.line.color.rgb = RGBColor(0x2E, 0x7D, 0x32)
    box2.line.width = Pt(1.5)

    tf2 = box2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "IN A COWORKER"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = RGBColor(0x2E, 0x7D, 0x32)
    p.alignment = PP_ALIGN.CENTER

    for item in [
        "Sudden change in personality or mood",
        "Increased absences or always being late",
        "Uncharacteristic mistakes or near-misses",
        "Pulling away from team conversations",
        "Comments like 'what's the point' or 'nobody cares'",
        "Visible exhaustion beyond normal fatigue",
        "Talking about feeling trapped or hopeless",
        "Giving away personal items (critical red flag)",
    ]:
        p = tf2.add_paragraph()
        p.text = f"  {item}"
        p.font.size = Pt(13)
        p.font.color.rgb = DARK_GRAY
        p.space_before = Pt(6)

    # ========== SLIDE 4: HOW TO RESPOND ==========
    slide = prs.slides.add_slide(blank_layout)
    add_panel_elements(slide, "Safe Moment")

    add_content_title(slide, "How to Respond: The R.E.A.C.H. Method")

    steps = [
        ("R", "Recognize", "Notice behavioral changes — trust your gut if something feels off."),
        ("E", "Engage", "Pull them aside privately. Start with: \"Hey, I've noticed you seem a bit off lately. How are you really doing?\""),
        ("A", "Ask Directly", "Don't be afraid to ask: \"Are you thinking about hurting yourself?\" — Asking does NOT plant the idea. It opens the door."),
        ("C", "Connect", "Help them access resources — EAP, counseling, a trusted leader. Walk with them if needed, don't just hand them a number."),
        ("H", "Hold Space", "Follow up. Check in again in a few days. Recovery isn't a single conversation — consistency shows you mean it."),
    ]

    for i, (letter, word, desc) in enumerate(steps):
        y_pos = Inches(1.6) + Inches(i * 1.1)

        # Letter circle
        circle = slide.shapes.add_shape(
            MSO_SHAPE.OVAL, Inches(5.0), y_pos, Inches(0.7), Inches(0.7)
        )
        circle.fill.solid()
        circle.fill.fore_color.rgb = BLUE
        circle.line.fill.background()
        tf = circle.text_frame
        tf.paragraphs[0].alignment = PP_ALIGN.CENTER
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.text = letter
        p.font.size = Pt(24)
        p.font.bold = True
        p.font.color.rgb = WHITE

        # Word + description
        tb = slide.shapes.add_textbox(Inches(5.9), y_pos, Inches(7.0), Inches(0.9))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = word
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = DARK_GRAY

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(14)
        p2.font.color.rgb = LIGHT_GRAY
        p2.space_before = Pt(2)

    # ========== SLIDE 5: STIGMA BUSTING ==========
    slide = prs.slides.add_slide(blank_layout)
    add_panel_elements(slide, "Safe Moment")

    add_content_title(slide, "Breaking the Stigma: Myths vs. Reality")

    myths = [
        ("\"Tough people don't need help.\"",
         "The toughest thing you can do is ask for help when you're struggling. SEALs, astronauts, and elite athletes all use mental health support."),
        ("\"It's a personal problem, not a work issue.\"",
         "When mental health suffers, safety performance drops. It IS a workplace issue — we spend more waking hours at work than anywhere else."),
        ("\"Talking about it makes it worse.\"",
         "Research consistently shows the opposite. Open conversation reduces distress, normalizes help-seeking, and can be life-saving."),
        ("\"I'll get fired or sidelined if I speak up.\"",
         "EAP services are confidential. Leaders who create safe reporting cultures see higher retention and fewer incidents."),
    ]

    for i, (myth, reality) in enumerate(myths):
        y_pos = Inches(1.5) + Inches(i * 1.45)

        # Myth
        tb = slide.shapes.add_textbox(Inches(5.0), y_pos, Inches(7.8), Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"MYTH: {myth}"
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = RGBColor(0xCC, 0x33, 0x33)

        # Reality
        tb2 = slide.shapes.add_textbox(Inches(5.0), y_pos + Inches(0.4), Inches(7.8), Inches(0.8))
        tf2 = tb2.text_frame
        tf2.word_wrap = True
        p2 = tf2.paragraphs[0]
        p2.text = f"REALITY: {reality}"
        p2.font.size = Pt(14)
        p2.font.color.rgb = DARK_GRAY

    # ========== SLIDE 6: WHAT YOU CAN DO TODAY ==========
    slide = prs.slides.add_slide(blank_layout)
    add_panel_elements(slide, "Safe Moment")

    add_content_title(slide, "What You Can Do Today")

    content = """
**As an Individual**
- Check in with yourself honestly — rate your mental energy 1-10 today
- If you're below a 5, tell someone. A supervisor, a peer, a friend
- Use your EAP — it's free, confidential, and available 24/7
- Set one boundary this week (e.g., no emails after 7pm, take a real lunch)

**As a Team Member**
- Make "How are you doing?" a real question, not just a greeting
- Normalize saying "I'm having a rough day" — and respond with empathy, not solutions
- Look out for the quiet ones — the person who never complains may need help the most
- Pair up: buddy-check systems work for mental health just like they do for physical safety

**As a Leader**
- Start your next toolbox talk or pre-job meeting with a mental health check-in
- Share your own struggles when appropriate — vulnerability from leaders is powerful
- Know your company's EAP contact and have it saved in your phone right now
- Remove the penalty: make it clear that asking for help is a strength, not a weakness
"""
    add_content_body(slide, content, y=Inches(1.4), font_size=Pt(14))

    # ========== SLIDE 7: RESOURCES & CRISIS INFO ==========
    slide = prs.slides.add_slide(blank_layout)
    add_panel_elements(slide, "Safe Moment")

    add_content_title(slide, "Resources & Crisis Support")

    # Emergency box
    ebox = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(5.0), Inches(1.5), Inches(7.8), Inches(1.6)
    )
    ebox.fill.solid()
    ebox.fill.fore_color.rgb = RGBColor(0xFD, 0xE8, 0xE8)
    ebox.line.color.rgb = RGBColor(0xCC, 0x00, 0x00)
    ebox.line.width = Pt(2)

    tf = ebox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "IN A CRISIS — ACT NOW"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = RGBColor(0xCC, 0x00, 0x00)
    p.alignment = PP_ALIGN.CENTER

    for line in [
        "988 Suicide & Crisis Lifeline — Call or text 988 (24/7)",
        "Crisis Text Line — Text HOME to 741741",
        "Emergency Services — Call 911",
    ]:
        p = tf.add_paragraph()
        p.text = line
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = DARK_GRAY
        p.alignment = PP_ALIGN.CENTER
        p.space_before = Pt(6)

    # Other resources
    content = """
**Ongoing Support**
- Employee Assistance Program (EAP) — Check with your HR or benefits team
- SAMHSA National Helpline — 1-800-662-4357 (free, confidential, 24/7)
- NAMI (National Alliance on Mental Illness) — nami.org

**Self-Care Tools**
- Apps: Calm, Headspace, Woebot (AI therapy), PTSD Coach (VA)
- Journaling: Even 5 minutes of writing reduces stress measurably
- Movement: 20 minutes of walking cuts anxiety symptoms by 30%

**Remember**
- You don't have to be "in crisis" to use these resources
- Reaching out early is the smartest safety decision you can make
- You are not a burden — you are a valued member of this team
"""
    add_content_body(slide, content, y=Inches(3.3), height=Inches(4.0), font_size=Pt(14))

    # ========== SLIDE 8: CLOSING ==========
    slide = prs.slides.add_slide(blank_layout)
    add_panel_elements(slide, "Safe Moment")

    tb = slide.shapes.add_textbox(Inches(5.0), Inches(1.5), Inches(7.8), Inches(2.0))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "\"Safety isn't just about\ngoing home in one piece."
    p.font.size = Pt(30)
    p.font.bold = True
    p.font.color.rgb = BLUE
    p.alignment = PP_ALIGN.CENTER

    p2 = tf.add_paragraph()
    p2.text = "It's about going home whole.\""
    p2.font.size = Pt(30)
    p2.font.bold = True
    p2.font.color.rgb = BLUE
    p2.alignment = PP_ALIGN.CENTER
    p2.space_before = Pt(8)

    # Discussion prompts
    tb2 = slide.shapes.add_textbox(Inches(5.0), Inches(4.0), Inches(7.8), Inches(2.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "DISCUSSION QUESTIONS"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = DARK_GRAY
    p.alignment = PP_ALIGN.LEFT

    questions = [
        "What's one thing that recharges you outside of work?",
        "Have you ever noticed a coworker struggling? What did you do?",
        "What would make it easier for YOU to ask for help on this team?",
    ]
    for q in questions:
        p = tf2.add_paragraph()
        p.text = f"  {q}"
        p.font.size = Pt(16)
        p.font.color.rgb = LIGHT_GRAY
        p.space_before = Pt(12)

    # Save
    prs.save('/home/user/savorpilot/Mental_Health_Safety_Moment.pptx')
    print("Presentation saved successfully!")


if __name__ == '__main__':
    create_presentation()
