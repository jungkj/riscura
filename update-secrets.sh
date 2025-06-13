#!/bin/bash

# Update .env with high-entropy secrets
sed -i.bak 's/JWT_SECRET=.*/JWT_SECRET=rrkHm3jmCpDMR29MOGvbX6oKNo5htjvEyAwyLhHyLCuaWquYuxgr4c0TkoYIsuz2BHaFBq4BqU9SLrr+FKKraA==/' .env
sed -i.bak 's/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=qe7OkaHCNzUAWVkiTQLPuqfnKDyvz+rPBRQuglgtsZJvbQyIBOJHcHbUevAAGl8Q26i5zTwzKiOhU8FmlFzdig==/' .env
sed -i.bak 's/SESSION_SECRET=.*/SESSION_SECRET=V7K0mVoRLZJE9YMRdLvCzlzsTfYZdGUx1tSt00FMWx47wCMwBdD7Px5cdq7981MxnwY0mqy236xl4ES8575lQA==/' .env
sed -i.bak 's/CSRF_SECRET=.*/CSRF_SECRET=2lh4ZZCj\/ucNBrcnF+X8I3NlqBk2rOi+CVBDXUihiPDCHE6iph2EZdBmf3gUDhJne7s1glE2clDKc4LizKsIyA==/' .env
sed -i.bak 's/COOKIE_SECRET=.*/COOKIE_SECRET=M0zD97udIsmUvg8ixX07CARlFIN8wp1JCNX5Yf9Jn+s0zwJak\/tz+N+zj2k5LajB6is7MciHI5clZmNExuXXHQ==/' .env
sed -i.bak 's/INTERNAL_API_KEY=.*/INTERNAL_API_KEY=5OWzDN+Mbvr\/TeLVuL0wjaQUDv1kLrCrhm4EAUWvlfE4y+wYx5oX+L8D44HsB40lZSXJAhwyvxl8Fut1vo8sXw==/' .env
sed -i.bak 's/DATABASE_ENCRYPTION_KEY=.*/DATABASE_ENCRYPTION_KEY=MPS0UUIJNBtrHzrA\/FxEL7fki1U8+c7jeeNdCPGgBLdwAJlScl\/Y65jjKrb+IfOZ6E8w2uA5n\/ekFVWgxecrg==/' .env
sed -i.bak 's/FILE_ENCRYPTION_KEY=.*/FILE_ENCRYPTION_KEY=o2DNSeEn1cGO5nRNUvhDQ\/Y8OygPYULDFfvpLCAeIBKmmp8y1LFfpO3OA28OsoHY2k8OabELCx1BT4sFN3eWSA==/' .env

echo "Updated .env with high-entropy secrets" 