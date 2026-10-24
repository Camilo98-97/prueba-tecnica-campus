import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";

export interface Course {
  id: number;
  name: string;
  credits: number;
  professorId: number;
  professorName: string;
}
export interface Profile {
  id: number;
  name: string;
  email: string;
  courses: Course[];
  totalCredits: number;
}
export interface Student {
  id: number;
  name: string;
  courses: string[];
}
export interface ClassGroup {
  id: number;
  name: string;
  credits: number;
  professorName: string;
  classmates: { name: string }[];
}
export interface ProfileInput {
  name: string;
  email: string;
}

@Injectable({ providedIn: "root" })
export class Api {
  private http = inject(HttpClient);
  courses = () => this.http.get<Course[]>("/api/courses");
  me = () => this.http.get<Profile>("/api/students/me");
  register = (input: ProfileInput & { password: string }) =>
    this.http.post<Profile>("/api/auth/register", input);
  login = (email: string, password: string) =>
    this.http.post<Profile>("/api/auth/login", { email, password });
  update = (input: ProfileInput) =>
    this.http.put<Profile>("/api/students/me", input);
  enroll = (courseIds: number[]) =>
    this.http.put<Profile>("/api/students/me/enrollment", { courseIds });
  remove = () => this.http.delete<void>("/api/students/me");
  logout = () => this.http.post<void>("/api/auth/logout", {});
  students = () => this.http.get<Student[]>("/api/students");
  classes = () => this.http.get<ClassGroup[]>("/api/students/me/classes");
}
