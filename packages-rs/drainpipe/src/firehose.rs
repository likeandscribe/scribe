use rsky_lexicon::com::atproto::sync::SubscribeRepos;
use serde::Deserialize;
use std::io::Cursor;

#[derive(Debug, Deserialize)]
pub struct Header {
    #[serde(rename(deserialize = "t"))]
    pub type_: String,
    #[serde(rename(deserialize = "op"))]
    pub operation: u8,
}

use std::fmt;

#[derive(Debug)]
pub enum Error {
    Header(ciborium::de::Error<std::io::Error>),
    Body(serde_ipld_dagcbor::DecodeError<std::io::Error>),
    UnknownTypeError(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Error::Header(e) => write!(f, "Header error: {}", e),
            Error::Body(e) => write!(f, "Body error: {}", e),
            Error::UnknownTypeError(s) => write!(f, "Unknown type error: {}", s),
        }
    }
}

impl std::error::Error for Error {
    fn description(&self) -> &str {
        "Read error"
    }
}

impl From<ciborium::de::Error<std::io::Error>> for Error {
    fn from(e: ciborium::de::Error<std::io::Error>) -> Self {
        Self::Header(e)
    }
}

impl From<serde_ipld_dagcbor::DecodeError<std::io::Error>> for Error {
    fn from(e: serde_ipld_dagcbor::DecodeError<std::io::Error>) -> Self {
        Self::Body(e)
    }
}

pub fn read(data: &[u8]) -> Result<(Header, SubscribeRepos), Error> {
    let mut reader = Cursor::new(data);

    let header = ciborium::de::from_reader::<Header, _>(&mut reader)?;
    let body = match header.type_.as_str() {
        "#commit" => SubscribeRepos::Commit(serde_ipld_dagcbor::from_reader(&mut reader)?),
        "#handle" => SubscribeRepos::Handle(serde_ipld_dagcbor::from_reader(&mut reader)?),
        "#tombstone" => SubscribeRepos::Handle(serde_ipld_dagcbor::from_reader(&mut reader)?),
        _ => {
            return Err(Error::UnknownTypeError(header.type_));
        }
    };

    Ok((header, body))
}
