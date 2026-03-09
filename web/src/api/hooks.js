import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

// ─── Auth / User ────────────────────────────────────────────
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.get('/me'),
    retry: false,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.patch('/me', { user: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['currentUser'] }),
  });
}

// ─── Exercises ──────────────────────────────────────────────
export function useExercises(search, muscleGroup) {
  return useQuery({
    queryKey: ['exercises', search, muscleGroup],
    queryFn: () => api.get('/exercises', { search, muscle_group: muscleGroup }),
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/exercises', { exercise: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

// ─── Workout Programs ───────────────────────────────────────
export function useWorkoutPrograms() {
  return useQuery({
    queryKey: ['workoutPrograms'],
    queryFn: () => api.get('/workout_programs'),
  });
}

export function useWorkoutProgram(id) {
  return useQuery({
    queryKey: ['workoutProgram', id],
    queryFn: () => api.get(`/workout_programs/${id}`),
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/workout_programs', { workout_program: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workoutPrograms'] }),
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/workout_programs/${id}`, { workout_program: data }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['workoutPrograms'] });
      qc.invalidateQueries({ queryKey: ['workoutProgram', vars.id] });
    },
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/workout_programs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workoutPrograms'] }),
  });
}

export function useReorderExercises(programId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds) =>
      api.patch(`/workout_programs/${programId}/program_exercises/reorder`, { ordered_ids: orderedIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workoutProgram', programId] }),
  });
}

export function useUpdateProgramExercise(programId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programExerciseId, ...data }) =>
      api.patch(`/workout_programs/${programId}/program_exercises/${programExerciseId}`, {
        program_exercise: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workoutProgram', programId] });
      qc.invalidateQueries({ queryKey: ['workoutSessions'] });
      qc.invalidateQueries({ queryKey: ['workoutSession'] });
    },
  });
}

// ─── Workout Sessions ───────────────────────────────────────
export function useWorkoutSessions(page = 1) {
  return useQuery({
    queryKey: ['workoutSessions', page],
    queryFn: () => api.get('/workout_sessions', { page }),
  });
}

export function useWorkoutSession(id) {
  return useQuery({
    queryKey: ['workoutSession', id],
    queryFn: () => api.get(`/workout_sessions/${id}`),
    enabled: !!id,
  });
}

export function useStartWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programId) =>
      api.post('/workout_sessions', { workout_session: { workout_program_id: programId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workoutSessions'] }),
  });
}

export function useCompleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.patch(`/workout_sessions/${id}`, { workout_session: { completed_at: new Date().toISOString() } }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['workoutSessions'] });
      qc.invalidateQueries({ queryKey: ['workoutSession', id] });
    },
  });
}

// ─── Sets ───────────────────────────────────────────────────
export function useCreateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...data }) =>
      api.post(`/workout_sessions/${sessionId}/session_sets`, { session_set: data }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['workoutSession', vars.sessionId] }),
  });
}

export function useUpdateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, setId, ...data }) =>
      api.patch(`/workout_sessions/${sessionId}/session_sets/${setId}`, { session_set: data }),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['workoutSession', vars.sessionId] }),
  });
}

export function useDeleteSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, setId }) =>
      api.delete(`/workout_sessions/${sessionId}/session_sets/${setId}`),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ['workoutSession', vars.sessionId] }),
  });
}

// ─── Nutrition ──────────────────────────────────────────────
export function useNutritionEntries(startDate, endDate) {
  return useQuery({
    queryKey: ['nutritionEntries', startDate, endDate],
    queryFn: () => api.get('/nutrition_entries', { start_date: startDate, end_date: endDate }),
    enabled: !!startDate,
  });
}

export function useCreateNutritionEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/nutrition_entries', { nutrition_entry: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutritionEntries'] }),
  });
}

export function useDeleteNutritionEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/nutrition_entries/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutritionEntries'] }),
  });
}

export function useImportNutrition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.upload('/nutrition_entries/import', formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutritionEntries'] }),
  });
}

// ─── Daily Reports ──────────────────────────────────────────
export function useDailyReports() {
  return useQuery({
    queryKey: ['dailyReports'],
    queryFn: () => api.get('/daily_reports'),
  });
}

export function useDailyReport(id) {
  return useQuery({
    queryKey: ['dailyReport', id],
    queryFn: () => api.get(`/daily_reports/${id}`),
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date) => api.post('/daily_reports/generate', { date }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dailyReports'] }),
  });
}

// ─── Metrics ────────────────────────────────────────────────
export function useMetrics(range = '30d') {
  return useQuery({
    queryKey: ['metrics', range],
    queryFn: () => api.get('/metrics', { range }),
    staleTime: 1000 * 60 * 5,
  });
}
