import { prisma } from "./prisma";

export async function getExperience() {
  return prisma.exp.findMany({
    orderBy: { start_date: "desc" },
  });
}

export async function getExperienceDetails(id: number) {
  return prisma.exp.findUnique({
    where: { id: BigInt(id) },
  });
}

export async function getProjects() {
  return prisma.projects.findMany();
}

export async function getSkills() {
  return prisma.skillset.findMany();
}

export async function getContact() {
  return prisma.contact.findMany();
}