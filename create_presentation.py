#!/usr/bin/env python3
"""Create a single-slide Mental Health Safety Moment with SLB Safe Moment theme."""

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
RED = RGBColor(0xCC, 0x33, 0x33)
GREEN = RGBColor(0x2E, 0x7D, 0x32)


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    # === LEFT BLUE PANEL ===
    s = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(4.5), SLIDE_HEIGHT)
    s.fill.solid(); s.fill.fore_color.rgb = BLUE; s.line.fill.background()

    # Speech bubble
    b = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.4), Inches(0.4), Inches(3.6), Inches(1.3))
    b.fill.background(); b.line.color.rgb = WHITE; b.line.width = Pt(3)
    p = b.text_frame.paragraphs[0]
    p.text = "Safe Moment"; p.font.size = Pt(28); p.font.bold = True; p.font.color.rgb = WHITE
    t = slide.shapes.add_shape(MSO_SHAPE.ISOSCELES_TRIANGLE, Inches(1.2), Inches(1.65), Inches(0.5), Inches(0.4))
    t.rotation = 180.0; t.fill.background(); t.line.color.rgb = WHITE; t.line.width = Pt(3)

    # Panel subtitle
    tb = slide.shapes.add_textbox(Inches(0.4), Inches(2.3), Inches(3.6), Inches(1.5))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = "Mental Health"; p.font.size = Pt(24); p.font.bold = True; p.font.color.rgb = WHITE
    p2 = tf.add_paragraph(); p2.text = "in the Workplace"; p2.font.size = Pt(24); p2.font.bold = True; p2.font.color.rgb = WHITE
    p3 = tf.add_paragraph(); p3.text = ""; p3.space_before = Pt(12)
    p4 = tf.add_paragraph(); p4.text = "Your mind is your most"; p4.font.size = Pt(15); p4.font.italic = True; p4.font.color.rgb = RGBColor(0xCC, 0xCC, 0xFF)
    p5 = tf.add_paragraph(); p5.text = "important piece of PPE."; p5.font.size = Pt(15); p5.font.italic = True; p5.font.color.rgb = RGBColor(0xCC, 0xCC, 0xFF)

    # Panel stats
    for i, (stat, label) in enumerate([("1 in 5", "adults affected yearly"), ("55%", "say job hurts mental health"), ("2x", "injury rate if untreated")]):
        yp = Inches(4.2) + Inches(i * 0.65)
        tb = slide.shapes.add_textbox(Inches(0.5), yp, Inches(3.5), Inches(0.55))
        tf = tb.text_frame; tf.word_wrap = True
        p = tf.paragraphs[0]
        run1 = p.add_run(); run1.text = f"{stat}  "; run1.font.size = Pt(18); run1.font.bold = True; run1.font.color.rgb = WHITE
        run2 = p.add_run(); run2.text = label; run2.font.size = Pt(13); run2.font.color.rgb = RGBColor(0xCC, 0xCC, 0xFF)

    # Hazard triangle
    h = slide.shapes.add_shape(MSO_SHAPE.ISOSCELES_TRIANGLE, Inches(0.5), Inches(5.9), Inches(0.7), Inches(0.6))
    h.fill.background(); h.line.color.rgb = WHITE; h.line.width = Pt(2)
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(5.95), Inches(0.7), Inches(0.55))
    p = tb.text_frame.paragraphs[0]; p.text = "!"; p.font.size = Pt(20); p.font.bold = True; p.font.color.rgb = WHITE; p.alignment = PP_ALIGN.CENTER

    # Separator line
    ln = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(6.55), Inches(3.5), Pt(2))
    ln.fill.solid(); ln.fill.fore_color.rgb = WHITE; ln.line.fill.background()

    # SLB logo
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(6.7), Inches(2), Inches(0.6))
    p = tb.text_frame.paragraphs[0]; p.text = "slb"; p.font.size = Pt(32); p.font.bold = True; p.font.color.rgb = WHITE

    # === RIGHT CONTENT AREA ===

    # Section: Warning Signs
    tb = slide.shapes.add_textbox(Inches(5.0), Inches(0.3), Inches(7.8), Inches(0.5))
    p = tb.text_frame.paragraphs[0]; p.text = "KNOW THE WARNING SIGNS"; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = BLUE

    signs = [
        "Persistent fatigue, difficulty concentrating, or uncharacteristic mistakes",
        "Withdrawal from team, mood swings, snapping over small things",
        "Comments like \"what's the point\" \u2014 or giving away personal items (red flag)",
    ]
    tb = slide.shapes.add_textbox(Inches(5.0), Inches(0.8), Inches(7.8), Inches(1.3))
    tf = tb.text_frame; tf.word_wrap = True
    for i, sign in enumerate(signs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = f"\u26a0  {sign}"; p.font.size = Pt(12); p.font.color.rgb = DARK; p.space_before = Pt(4)

    # Section: R.E.A.C.H. Method
    tb = slide.shapes.add_textbox(Inches(5.0), Inches(2.1), Inches(7.8), Inches(0.5))
    p = tb.text_frame.paragraphs[0]; p.text = "RESPOND WITH R.E.A.C.H."; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = BLUE

    reach = [
        ("R", "Recognize", "Notice changes \u2014 trust your gut"),
        ("E", "Engage", "\"How are you really doing?\""),
        ("A", "Ask Directly", "\"Are you thinking of hurting yourself?\" \u2014 it opens the door"),
        ("C", "Connect", "Walk them to EAP/counseling \u2014 don't just hand a number"),
        ("H", "Hold Space", "Follow up in days \u2014 consistency matters"),
    ]
    for i, (letter, word, desc) in enumerate(reach):
        yp = Inches(2.6) + Inches(i * 0.42)
        tb = slide.shapes.add_textbox(Inches(5.0), yp, Inches(7.8), Inches(0.4))
        tf = tb.text_frame; tf.word_wrap = True
        p = tf.paragraphs[0]
        r1 = p.add_run(); r1.text = f" {letter} "; r1.font.size = Pt(13); r1.font.bold = True; r1.font.color.rgb = WHITE
        # Simulate circle background with a shape
        r2 = p.add_run(); r2.text = f"  {word}: "; r2.font.size = Pt(13); r2.font.bold = True; r2.font.color.rgb = DARK
        r3 = p.add_run(); r3.text = desc; r3.font.size = Pt(12); r3.font.color.rgb = GRAY

    # Add small circles behind R.E.A.C.H. letters
    for i, letter in enumerate("REACH"):
        yp = Inches(2.6) + Inches(i * 0.42) + Pt(2)
        c = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(5.0), yp, Inches(0.32), Inches(0.32))
        c.fill.solid(); c.fill.fore_color.rgb = BLUE; c.line.fill.background()
        c.text_frame.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = c.text_frame.paragraphs[0]; p.text = letter; p.font.size = Pt(12); p.font.bold = True; p.font.color.rgb = WHITE; p.alignment = PP_ALIGN.CENTER

    # Section: What You Can Do
    tb = slide.shapes.add_textbox(Inches(5.0), Inches(4.85), Inches(7.8), Inches(0.4))
    p = tb.text_frame.paragraphs[0]; p.text = "WHAT YOU CAN DO TODAY"; p.font.size = Pt(16); p.font.bold = True; p.font.color.rgb = BLUE

    actions = [
        "Rate your mental energy 1-10 \u2014 below 5? Tell someone today",
        "Make \"how are you?\" a real question, not just a greeting",
        "Use your EAP \u2014 it's free, confidential, and available 24/7",
    ]
    tb = slide.shapes.add_textbox(Inches(5.0), Inches(5.25), Inches(7.8), Inches(1.0))
    tf = tb.text_frame; tf.word_wrap = True
    for i, action in enumerate(actions):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = f"\u2714  {action}"; p.font.size = Pt(12); p.font.color.rgb = DARK; p.space_before = Pt(4)

    # Crisis resources bar at bottom
    bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(5.0), Inches(6.35), Inches(7.8), Inches(0.9))
    bar.fill.solid(); bar.fill.fore_color.rgb = RGBColor(0xFD, 0xE8, 0xE8); bar.line.color.rgb = RGBColor(0xCC, 0x00, 0x00); bar.line.width = Pt(1.5)
    tf = bar.text_frame; tf.word_wrap = True; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    r1 = p.add_run(); r1.text = "CRISIS? "; r1.font.size = Pt(13); r1.font.bold = True; r1.font.color.rgb = RGBColor(0xCC, 0x00, 0x00)
    r2 = p.add_run(); r2.text = "Call/Text 988  |  Text HOME to 741741  |  Call 911  |  "; r2.font.size = Pt(13); r2.font.bold = True; r2.font.color.rgb = DARK
    r3 = p.add_run(); r3.text = "You are not a burden."; r3.font.size = Pt(13); r3.font.italic = True; r3.font.color.rgb = GRAY
    p.alignment = PP_ALIGN.CENTER

    prs.save('/home/user/savorpilot/Mental_Health_Safety_Moment.pptx')
    print("Done! Single slide created.")


if __name__ == '__main__':
    main()
