import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthorBioProps {
  author: {
    name: string;
    avatar: string;
    bio: string;
    linkedin?: string;
  }
}

export default function AuthorBio({ author }: AuthorBioProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-12">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Author</h3>
      <div className="flex items-start gap-4">
        <Image
          src={author.avatar}
          alt={author.name}
          width={80}
          height={80}
          className="rounded-full flex-shrink-0"
        />
        <div className="flex-1">
          <h4 className="text-lg font-medium text-gray-900 mb-2">{author.name}</h4>
          <p className="text-gray-600 mb-3">{author.bio}</p>
          {author.linkedin && (
            <Link
              href={author.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
              </svg>
              Connect on LinkedIn
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
