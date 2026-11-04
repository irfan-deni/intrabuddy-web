CREATE POLICY "chat_sessions_delete_own"
  ON public.chat_sessions
  FOR DELETE
  TO public
  USING (student_id = auth.uid());

CREATE POLICY "chat_messages_delete_own"
  ON public.chat_messages
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions s
      WHERE s.id = chat_messages.session_id
        AND s.student_id = auth.uid()
    )
  );
