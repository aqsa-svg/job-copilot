"use client";

import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";

import type { Resume, ResumeTemplate } from "@/lib/types";

// Built-in fonts only (no downloads → works fully offline). Two templates:
//   classic = serif (Times), centered header
//   modern  = sans (Helvetica), left-aligned header
// Both are single column with standard sections = ATS-friendly. `scale` shrinks
// every size + spacing uniformly for one-page fit (no content is removed).
function makeStyles(scale: number, template: ResumeTemplate) {
  const s = (n: number) => n * scale;
  const modern = template === "modern";
  const fam = modern ? "Helvetica" : "Times-Roman";
  const famBold = modern ? "Helvetica-Bold" : "Times-Bold";
  const align = modern ? "left" : "center";
  const justify = modern ? "flex-start" : "center";

  return StyleSheet.create({
    page: {
      paddingVertical: s(40),
      paddingHorizontal: s(48),
      fontFamily: fam,
      fontSize: s(10.5),
      color: "#1a1a1a",
      lineHeight: 1.4,
    },
    header: {
      textAlign: align,
      borderBottomWidth: modern ? 2 : 1,
      borderBottomColor: modern ? "#111111" : "#cccccc",
      paddingBottom: s(8),
      marginBottom: s(4),
    },
    name: {
      fontSize: s(modern ? 21 : 22),
      fontFamily: famBold,
      color: "#111111",
      letterSpacing: modern ? s(0.5) : 0,
    },
    title: {
      fontSize: s(10),
      letterSpacing: s(modern ? 1 : 2),
      textTransform: "uppercase",
      color: modern ? "#444444" : "#555555",
      marginTop: s(3),
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: justify,
      marginTop: s(5),
      gap: s(6),
    },
    contactItem: { fontSize: s(9.5), color: "#444444" },
    link: { fontSize: s(9.5), color: modern ? "#111111" : "#2b4bd6", textDecoration: "none" },
    section: { marginTop: s(12) },
    sectionTitle: {
      fontSize: s(9.5),
      fontFamily: famBold,
      letterSpacing: s(1.5),
      textTransform: "uppercase",
      color: modern ? "#111111" : "#666666",
      borderBottomWidth: modern ? 0 : 1,
      borderBottomColor: "#cccccc",
      paddingBottom: s(2),
      marginBottom: s(5),
    },
    summary: { fontSize: s(10.5), color: "#222222" },
    skillRow: { fontSize: s(10), marginBottom: s(2) },
    skillCat: { fontFamily: famBold, color: "#111111" },
    entry: { marginBottom: s(8) },
    entryHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    entryTitle: { fontSize: s(11), fontFamily: famBold, color: "#111111" },
    entryCompany: { fontFamily: fam, color: "#333333" },
    entryDates: { fontSize: s(9.5), color: "#555555" },
    entryMeta: { fontSize: s(9.5), fontStyle: "italic", color: "#555555" },
    bulletRow: { flexDirection: "row", marginTop: s(2), paddingLeft: s(4) },
    bulletDot: { width: s(10), fontSize: s(10.5) },
    bulletText: { flex: 1, fontSize: s(10), color: "#222222" },
    eduDegree: { fontSize: s(10), color: "#222222" },
    eduDetails: { fontSize: s(9.5), color: "#444444" },
  });
}

export function ResumePdfDocument({
  resume,
  scale = 1,
  template = "classic",
}: {
  resume: Resume;
  scale?: number;
  template?: ResumeTemplate;
}) {
  const styles = makeStyles(scale, template);
  const contact = resume.contact || { email: "", phone: "", location: "", links: [] };
  const contactBits = [contact.email, contact.phone, contact.location].filter(Boolean);

  const Bullets = ({ items }: { items?: string[] }) => (
    <>
      {(items || []).map((b, i) => (
        <View style={styles.bulletRow} key={i} wrap={false}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </>
  );

  return (
    <Document
      title={`${resume.name || "Resume"} - Resume`}
      author={resume.name || "Job Copilot"}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{resume.name || "Your Name"}</Text>
          {resume.title ? <Text style={styles.title}>{resume.title}</Text> : null}
          <View style={styles.contactRow}>
            {contactBits.map((b, i) => (
              <Text style={styles.contactItem} key={i}>
                {b}
                {i < contactBits.length - 1 ? "   •" : ""}
              </Text>
            ))}
          </View>
          {contact.links?.length > 0 && (
            <View style={styles.contactRow}>
              {contact.links.map((l, i) => (
                <Link style={styles.link} src={l.url} key={i}>
                  {l.label || l.url}
                </Link>
              ))}
            </View>
          )}
        </View>

        {resume.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{resume.summary}</Text>
          </View>
        ) : null}

        {resume.skills?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {resume.skills.map((g, i) =>
              g.items?.length > 0 ? (
                <Text style={styles.skillRow} key={i}>
                  <Text style={styles.skillCat}>{g.category}: </Text>
                  {g.items.join(", ")}
                </Text>
              ) : null
            )}
          </View>
        )}

        {resume.experience?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {resume.experience.map((e, i) => (
              <View style={styles.entry} key={i} wrap={false}>
                <View style={styles.entryHead}>
                  <Text style={styles.entryTitle}>
                    {e.role}
                    {e.company ? (
                      <Text style={styles.entryCompany}> · {e.company}</Text>
                    ) : null}
                  </Text>
                  <Text style={styles.entryDates}>
                    {[e.start, e.end].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {e.location ? <Text style={styles.entryMeta}>{e.location}</Text> : null}
                <Bullets items={e.bullets} />
              </View>
            ))}
          </View>
        )}

        {resume.projects?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {resume.projects.map((p, i) => (
              <View style={styles.entry} key={i} wrap={false}>
                <View style={styles.entryHead}>
                  {p.link ? (
                    <Link style={[styles.entryTitle, styles.link]} src={p.link}>
                      {p.name}
                    </Link>
                  ) : (
                    <Text style={styles.entryTitle}>{p.name}</Text>
                  )}
                </View>
                {p.tech?.length > 0 && (
                  <Text style={styles.entryMeta}>{p.tech.join(", ")}</Text>
                )}
                <Bullets items={p.bullets} />
              </View>
            ))}
          </View>
        )}

        {resume.education?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {resume.education.map((ed, i) => (
              <View style={styles.entry} key={i} wrap={false}>
                <View style={styles.entryHead}>
                  <Text style={styles.entryTitle}>{ed.school}</Text>
                  <Text style={styles.entryDates}>
                    {[ed.start, ed.end].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                <Text style={styles.eduDegree}>
                  {[ed.degree, ed.field].filter(Boolean).join(", ")}
                </Text>
                {ed.details ? <Text style={styles.eduDetails}>{ed.details}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
