export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return <div className="typing-indicator" />;

  const names = typingUsers.map((u) => u.name.split(' ')[0]);
  const text = names.length === 1 ? `${names[0]} is typing` : `${names.join(', ')} are typing`;

  return (
    <div className="typing-indicator flex items-center gap-2">
      <span>{text}</span>
      <span className="typing-dots"><span /><span /><span /></span>
    </div>
  );
}
