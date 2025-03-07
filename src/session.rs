use arraydeque::{ArrayDeque, Wrapping};
use lru::LruCache;
use std::num::NonZeroUsize;
use std::sync::{LazyLock, Mutex};

// Maximum number of concurrently stored sessions
// This is the maximum number of conversations that
// we keep track of in memory. If the number of
// sessions exceeds this limit, the least recently
// used session will be evicted to make room for
// the new session.
const MAX_SESSIONS: usize = 100;

// The length of the context window for each session
// This is the number of messages that we keep track of
// in a conversation. If a session reaches this limit,
// the oldest message will be dropped to make room for
// the new message.
const MAX_MESSAGES_PER_SESSION: usize = 100;

// This is our global storage for chat sessions.
// We use a lazy lock to ensure that the store is only initialized once.
pub static STORE: LazyLock<SessionStore> = LazyLock::new(SessionStore::new);

// Session store to keep track of the context of a conversation
pub struct SessionStore {
    sessions: Mutex<LruCache<String, Session>>,
}

impl SessionStore {
    // Create a new session store. This function is private to ensure that the store is only created once.
    fn new() -> Self {
        Self {
            sessions: Mutex::new(LruCache::new(NonZeroUsize::new(MAX_SESSIONS).unwrap())),
        }
    }

    // Create a new session in the store
    pub fn create_session(&self, id: &str, prompts: Vec<Message>) {
        let session = Session::new(prompts);
        let mut guard = self.sessions.lock().unwrap();
        guard.push(id.to_string(), session);
    }

    // Get the context window for a given session
    pub fn context_window(&self, id: &str) -> Option<Vec<Message>> {
        let mut guard = self.sessions.lock().unwrap();
        guard.get(id).map(|session| session.context_window())
    }

    // Append messages to the context window of a given session
    pub fn append_messages(&self, id: &str, messages: Vec<Message>) {
        let mut guard = self.sessions.lock().unwrap();
        if let Some(session) = guard.get_mut(id) {
            for message in messages {
                session.append(message);
            }
        }
    }

    // Remove a session from the store
    pub fn remove_session(&self, id: &str) {
        let mut guard = self.sessions.lock().unwrap();
        guard.pop(&id.to_string());
    }
}

// Session struct to store the context of a conversation
struct Session {
    // The initial prompts for this session
    prompts: Vec<Message>,

    // The context window of the conversation about the text
    // We are using a ring buffer to store the last
    // MAX_MESSAGES_PER_SESSION messages
    chat: ArrayDeque<Message, MAX_MESSAGES_PER_SESSION, Wrapping>,
}

impl Session {
    // Create a new session with the given prompts
    fn new(prompts: Vec<Message>) -> Self {
        Self {
            prompts,
            chat: ArrayDeque::new(),
        }
    }

    // Append a new message to the context window
    // If the buffer is full, the oldest message will be
    // dropped to make room for the new message
    fn append(&mut self, message: Message) {
        self.chat.push_back(message);
    }

    // Get the context window for this session
    fn context_window(&self) -> Vec<Message> {
        // always prepend the original prompts to the context
        // window, we do this here instead adding them directly
        // to the beginning of `self.chat` to avoid losing them
        // when the ring buffer is full
        let mut context = self.prompts.clone();

        // add the messages from the ring buffer
        context.extend(self.chat.iter().cloned().collect::<Vec<Message>>());

        // return the context window
        context
    }
}
// Source of a message
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MessageSource {
    System,
    Assistant,
    User,
}

// Message struct to store chat messages with their roles
#[derive(Debug, Clone)]
pub struct Message {
    pub text: String,
    pub source: MessageSource,
}

impl Message {
    pub fn new(text: &str, source: MessageSource) -> Self {
        Self {
            text: text.to_string(),
            source,
        }
    }

    pub fn system(text: &str) -> Self {
        Self::new(text, MessageSource::System)
    }

    pub fn assistant(text: &str) -> Self {
        Self::new(text, MessageSource::Assistant)
    }

    pub fn user(text: &str) -> Self {
        Self::new(text, MessageSource::User)
    }
}
