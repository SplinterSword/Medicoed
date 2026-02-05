'use client';

import React, { useState } from 'react';
import { FaHeart, FaComment, FaShare } from 'react-icons/fa';
import '../styles/CommunityPreview.css';

export default function CommunityPreview({ isDarkTheme = false }) {
  const [likedPosts, setLikedPosts] = useState({});

  const trendingHashtags = [
    { tag: 'cardiology', count: 2341, trending: true },
    { tag: 'pharmacology', count: 1890, trending: false },
    { tag: 'anatomy', count: 1654, trending: true },
    { tag: 'clinicalreasoning', count: 1432, trending: false },
    { tag: 'pediatrics', count: 1205, trending: true },
  ];

  const posts = [
    {
      id: 1,
      author: 'Dr. Sarah Chen',
      specialty: 'Cardiology',
      avatar: '👨‍⚕️',
      title: 'ECG interpretation tips for beginners',
      excerpt: 'Just completed a challenging cardiology case. Here are the key ECG findings that helped me arrive at the diagnosis...',
      likes: 342,
      comments: 28,
      tags: ['cardiology', 'ecg', 'clinicalreasoning']
    },
    {
      id: 2,
      author: 'Med Student Alex',
      specialty: 'Internal Medicine',
      avatar: '👩‍⚕️',
      title: 'Best approach to differential diagnosis in GI cases',
      excerpt: 'Struggled with GI cases for weeks until I discovered this systematic approach. Now I can solve them confidently...',
      likes: 287,
      comments: 42,
      tags: ['internalmedicine', 'gastrointestinal', 'diagnosis']
    },
    {
      id: 3,
      author: 'Dr. James Wilson',
      specialty: 'Pediatrics',
      avatar: '👨‍⚕️',
      title: 'Pediatric dosage calculations made easy',
      excerpt: 'A simple framework for calculating pediatric drug dosages correctly every time. No more calculation errors...',
      likes: 456,
      comments: 65,
      tags: ['pediatrics', 'pharmacology', 'safety']
    }
  ];

  const toggleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <section className={`medicoed-cp-section ${isDarkTheme ? 'medicoed-dark-theme' : 'medicoed-light-theme'}`}>
      <div className="medicoed-cp-container">
        <div className="medicoed-cp-header">
          <h2 className="medicoed-cp-title">
            Learn from the <span className="medicoed-highlight">Community</span>
          </h2>
          <p className="medicoed-cp-subtitle">
            Learn from peers, share discoveries, and grow together
          </p>
        </div>

        <div className="medicoed-cp-content">
          <div className="medicoed-cp-trending">
            <h3 className="medicoed-cp-trending-title">Trending Topics</h3>

            <div>
              {trendingHashtags.map((item, idx) => (
                <div key={idx} className="medicoed-cp-hashtag">
                  <div>
                    <p className="medicoed-cp-hashtag-name">#{item.tag}</p>
                    <p className="medicoed-cp-hashtag-count">
                      {item.count.toLocaleString()} posts
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="medicoed-cp-posts">
            {posts.map((post, idx) => (
              <div key={post.id} className="medicoed-cp-post-card">
                <div className="medicoed-cp-post-header">
                  <div className="medicoed-cp-post-avatar">{post.avatar}</div>
                  <div className="medicoed-cp-post-meta">
                    <p className="medicoed-cp-post-author">{post.author}</p>
                    <p className="medicoed-cp-post-specialty">{post.specialty}</p>
                  </div>
                  <div className="medicoed-cp-post-live"></div>
                </div>

                <h3 className="medicoed-cp-post-title">{post.title}</h3>
                <p className="medicoed-cp-post-excerpt">{post.excerpt}</p>

                <div className="medicoed-cp-post-tags">
                  {post.tags.map((tag, tagIdx) => (
                    <span key={tagIdx} className="medicoed-cp-tag">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="medicoed-cp-post-actions">
                  <div
                    className="medicoed-cp-action"
                    onClick={() => toggleLike(post.id)}
                  >
                    <FaHeart
                      size={16}
                      style={{
                        color: likedPosts[post.id] ? '#28a745' : 'inherit'
                      }}
                    />
                    <span>{post.likes + (likedPosts[post.id] ? 1 : 0)}</span>
                  </div>
                  <div className="medicoed-cp-action">
                    <FaComment size={16} />
                    <span>{post.comments}</span>
                  </div>
                  <div className="medicoed-cp-action">
                    <FaShare size={16} />
                    <span>Share</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
